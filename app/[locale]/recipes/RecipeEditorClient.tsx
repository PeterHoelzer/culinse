"use client";
import { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Checkbox, Icon, Input, Notice, SectionHeader, Textarea, chipClasses } from "@/components/ui";

interface Ingredient { name: string; amount: string; unit: string; }
interface Instruction { step: number; text: string; timer_minutes: number | null; }
interface RecipeData {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  image_position: string;
  images: string[];
  video_url: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cook_time: string;
  prep_time: string;
  servings: string;
  tags: string[];
  is_public: boolean;
  source_type?: string;
}

const EMPTY: RecipeData = {
  title: "", description: "", image_url: "", image_position: "50% 50%", images: [], video_url: "",
  ingredients: [{ name: "", amount: "", unit: "" }],
  instructions: [{ step: 1, text: "", timer_minutes: null }],
  cook_time: "", prep_time: "", servings: "2", tags: [], is_public: false, source_type: "created",
};

function serializeRecipe(data: RecipeData, untitled: string) {
  return {
    title: data.title || untitled,
    description: data.description,
    image_url: data.images[0] ?? data.image_url,
    images: data.images,
    image_position: data.image_position || "50% 50%",
    video_url: data.video_url,
    ingredients: data.ingredients.filter(i => i.name),
    instructions: data.instructions.filter(i => i.text),
    cook_time: data.cook_time ? parseInt(data.cook_time) : null,
    prep_time: data.prep_time ? parseInt(data.prep_time) : null,
    servings: parseInt(data.servings) || 2,
    tags: data.tags,
    is_public: data.is_public,
  };
}

function isValidVideoUrl(url: string): boolean {
  if (!url) return true;
  return /^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|tiktok\.com\/)/.test(url);
}

// Namen der fünf Schritte: Schlüssel im Bereich "recipeEditor" der messages/*.json.
const STEP_KEYS = ["stepBasics", "stepIngredients", "stepInstructions", "stepMedia", "stepPublish"] as const;

interface Props { mode: "create" | "edit"; recipeId?: string; }

export default function RecipeEditorClient({ mode, recipeId }: Props) {
  const router = useRouter();
  const t = useTranslations("recipeEditor");
  const untitled = t("untitled");
  const STEP_NAMES = STEP_KEYS.map(k => t(k));
  const [recipe, setRecipe] = useState<RecipeData>(EMPTY);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef<string | null>(recipeId ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // ── Image focal point (object-position) drag ────────────────────────────────
  const parsePos = (s: string) => {
    const m = (s || "50% 50%").match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 };
  };
  const onImgDragStart = (e: React.PointerEvent) => {
    if (!recipe.images[0]) return;
    const { x, y } = parsePos(recipe.image_position);
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: x, baseY: y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onImgDragMove = (e: React.PointerEvent) => {
    if (!dragState.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    // Dragging the image down should reveal its top, so the focal % decreases.
    const nx = Math.min(100, Math.max(0, dragState.current.baseX - (dx / rect.width) * 100));
    const ny = Math.min(100, Math.max(0, dragState.current.baseY - (dy / rect.height) * 100));
    setRecipe(p => ({ ...p, image_position: `${Math.round(nx)}% ${Math.round(ny)}%` }));
  };
  const onImgDragEnd = () => { dragState.current = null; };

  // Load existing recipe in edit mode
  useEffect(() => {
    if (mode === "edit" && recipeId) {
      fetch(`/api/user-recipes/${recipeId}`)
        .then(r => r.json())
        .then(d => {
          if (d.recipe) {
            const r = d.recipe;
            setRecipe({
              title: r.title ?? "",
              description: r.description ?? "",
              image_url: r.image_url ?? "",
              image_position: r.image_position ?? "50% 50%",
              images: Array.isArray(r.images) && r.images.length ? r.images.filter((u: unknown): u is string => typeof u === "string") : r.image_url ? [r.image_url] : [],
              video_url: r.video_url ?? "",
              ingredients: r.ingredients?.length ? r.ingredients : [{ name: "", amount: "", unit: "" }],
              instructions: r.instructions?.length ? r.instructions : [{ step: 1, text: "", timer_minutes: null }],
              cook_time: r.cook_time ? String(r.cook_time) : "",
              prep_time: r.prep_time ? String(r.prep_time) : "",
              servings: r.servings ? String(r.servings) : "2",
              tags: Array.isArray(r.tags) ? r.tags : [],
              is_public: r.is_public ?? false,
              source_type: r.source_type ?? "created",
            });
          }
        });
    }
  }, [mode, recipeId]);

  // Auto-save draft every 30s
  const saveDraft = useCallback(async (data: RecipeData) => {
    const body = serializeRecipe(data, untitled);
    if (draftIdRef.current) {
      await fetch(`/api/user-recipes/${draftIdRef.current}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } else {
      const res = await fetch("/api/user-recipes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.recipe?.id) draftIdRef.current = d.recipe.id;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [untitled]);

  useEffect(() => {
    if (!recipe.title && mode === "create") return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveDraft(recipe), 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [recipe, saveDraft, mode]);

  // Per-step validation
  const getStepErrors = (s: number): string[] => {
    if (s === 0 && !recipe.title.trim()) return [t("errTitle")];
    if (s === 1 && !recipe.ingredients.some(i => i.name.trim())) return [t("errIngredient")];
    if (s === 2 && !recipe.instructions.some(i => i.text.trim())) return [t("errInstruction")];
    if (s === 3 && recipe.video_url && !isValidVideoUrl(recipe.video_url)) return [t("videoError")];
    return [];
  };

  const handleNext = () => {
    const errs = getStepErrors(step);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setStep(s => s + 1);
  };

  // Image upload to Supabase Storage — mehrere Dateien pro Auswahl moeglich;
  // das erste Galerie-Bild ist das Cover (image_url bleibt fuer Karten synchron).
  const MAX_IMAGES = 6;
  const IMAGE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif",
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const uploaded: string[] = [];
    for (const file of files.slice(0, Math.max(0, MAX_IMAGES - recipe.images.length))) {
      // Nur Bilder bis 10 MB, und die Endung kommt aus dem Dateityp. Vorher kam sie
      // aus dem Dateinamen; so ließ sich auch eine .html- oder .svg-Datei in die
      // öffentliche Ablage legen. Die Ablage selbst muss dieselbe Grenze haben
      // (supabase/security_hardening_2026_11.sql), denn diese Prüfung läuft im Browser.
      const ext = IMAGE_EXTENSIONS[file.type];
      if (!ext || file.size > 10 * 1024 * 1024) continue;
      const path = `${uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("recipe-media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from("recipe-media").getPublicUrl(data.path);
        uploaded.push(publicUrl);
      }
    }
    if (uploaded.length) {
      setRecipe(prev => {
        const images = [...prev.images, ...uploaded].slice(0, MAX_IMAGES);
        return { ...prev, images, image_url: images[0] };
      });
    }
    setUploading(false);
  };
  const removeImage = (idx: number) => setRecipe(p => {
    const images = p.images.filter((_, i) => i !== idx);
    return { ...p, images, image_url: images[0] ?? "", image_position: idx === 0 ? "50% 50%" : p.image_position };
  });
  const makeCover = (idx: number) => setRecipe(p => {
    if (idx === 0) return p;
    const images = [p.images[idx], ...p.images.filter((_, i) => i !== idx)];
    return { ...p, images, image_url: images[0], image_position: "50% 50%" };
  });

  const handlePublish = async () => {
    const errs: string[] = [];
    if (!recipe.title.trim()) errs.push(t("errTitle"));
    if (recipe.is_public && !recipe.images.length) errs.push(t("errPhoto"));
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);
    setErrors([]);
    const method = draftIdRef.current ? "PUT" : "POST";
    const url = draftIdRef.current ? `/api/user-recipes/${draftIdRef.current}` : "/api/user-recipes";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(serializeRecipe(recipe, untitled)),
    });
    const d = await res.json();
    if (res.status === 422) {
      // Der Server nennt die Gründe als Kürzel (issueCodes); die Texte stehen in messages/*.json.
      const codes: string[] = Array.isArray(d.issueCodes) ? d.issueCodes : [];
      setErrors(codes.length ? codes.map(c => (t.has(`issue_${c}`) ? t(`issue_${c}`) : c)) : [t("errQuality")]);
      setSaving(false);
      return;
    }
    if (!draftIdRef.current && d.recipe?.id) draftIdRef.current = d.recipe.id;
    setSaving(false);
    router.push("/my-recipes");
  };

  // Tag helpers
  const addTag = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !recipe.tags.includes(trimmed)) {
      setRecipe(p => ({ ...p, tags: [...p.tags, trimmed] }));
    }
    setTagInput("");
  };
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    if (e.key === "Backspace" && !tagInput && recipe.tags.length) {
      setRecipe(p => ({ ...p, tags: p.tags.slice(0, -1) }));
    }
  };
  const removeTag = (tag: string) => setRecipe(p => ({ ...p, tags: p.tags.filter(x => x !== tag) }));

  // Ingredient helpers
  const updateIngredient = (i: number, field: keyof Ingredient, val: string) => {
    setRecipe(prev => { const next = [...prev.ingredients]; next[i] = { ...next[i], [field]: val }; return { ...prev, ingredients: next }; });
  };
  const addIngredient = () => setRecipe(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: "", amount: "", unit: "" }] }));
  const removeIngredient = (i: number) => setRecipe(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, idx) => idx !== i) }));

  // Instruction helpers
  const updateInstruction = (i: number, field: keyof Instruction, val: string | number | null) => {
    setRecipe(prev => { const next = [...prev.instructions]; next[i] = { ...next[i], [field]: val }; return { ...prev, instructions: next }; });
  };
  const addInstruction = () => setRecipe(prev => ({
    ...prev, instructions: [...prev.instructions, { step: prev.instructions.length + 1, text: "", timer_minutes: null }]
  }));
  const removeInstruction = (i: number) => setRecipe(prev => ({
    ...prev, instructions: prev.instructions.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 }))
  }));

  const videoUrlError = recipe.video_url && !isValidVideoUrl(recipe.video_url);
  const ingredientCount = recipe.ingredients.filter(i => i.name).length;
  const stepCount = recipe.instructions.filter(i => i.text).length;

  const addRowButton = "flex h-11 w-full items-center justify-center gap-2 rounded-2 border border-dashed border-line-strong text-base font-semibold text-ink-2 transition-colors hover:bg-surface-soft";

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            as="h1"
            className="mb-0!"
            title={mode === "create" ? t("createTitle") : t("editTitle")}
            subtitle={<span className="tabular">{t("stepOf", { current: step + 1, total: STEP_NAMES.length, name: STEP_NAMES[step] })}</span>}
          />
          <div className="flex items-center gap-3">
            <span aria-live="polite" className="text-sm font-semibold text-green-deep">{saved ? t("saved") : ""}</span>
            <Button variant="secondary" size="sm" onClick={() => saveDraft(recipe)}>{t("saveDraft")}</Button>
          </div>
        </div>

        <ol className="mb-8 flex max-w-prose gap-2" aria-label={t("stepsLabel")}>
          {STEP_NAMES.map((name, i) => (
            <li key={STEP_KEYS[i]} className="flex-1">
              <button
                type="button"
                disabled={i >= step}
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                aria-label={i < step ? t("stepDone", { name }) : i === step ? t("stepCurrent", { name }) : name}
                className={`block h-1.5 w-full rounded-1 transition-colors ${i <= step ? "bg-brand" : "bg-line"} ${i < step ? "cursor-pointer" : "cursor-default"}`}
              />
            </li>
          ))}
        </ol>

        <div className="max-w-prose">
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <Input
                label={t("titleLabel")}
                type="text"
                required
                value={recipe.title}
                onChange={e => setRecipe(p => ({ ...p, title: e.target.value }))}
                placeholder={t("titlePlaceholder")}
                autoComplete="off"
              />
              <Textarea
                label={t("descLabel")}
                value={recipe.description}
                onChange={e => setRecipe(p => ({ ...p, description: e.target.value }))}
                placeholder={t("descPlaceholder")}
                rows={3}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label={t("prepTime")} type="number" inputMode="numeric" min={0} value={recipe.prep_time}
                  onChange={e => setRecipe(p => ({ ...p, prep_time: e.target.value }))} placeholder="15" />
                <Input label={t("cookTime")} type="number" inputMode="numeric" min={0} value={recipe.cook_time}
                  onChange={e => setRecipe(p => ({ ...p, cook_time: e.target.value }))} placeholder="30" />
                <Input label={t("servings")} type="number" inputMode="numeric" min={1} value={recipe.servings}
                  onChange={e => setRecipe(p => ({ ...p, servings: e.target.value }))} placeholder="4" />
              </div>
              <div>
                <Input
                  label={t("tagsLabel")}
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={t("tagsPlaceholder")}
                  hint={t("tagsHint")}
                  autoComplete="off"
                />
                {recipe.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {recipe.tags.map(tag => (
                      <li key={tag}>
                        <button type="button" onClick={() => removeTag(tag)} aria-label={t("removeTag", { tag })} className={chipClasses(false, "sm")}>
                          {tag}
                          <Icon name="x" size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Ingredients */}
          {step === 1 && (
            <div>
              <p className="mb-4 text-base text-ink-2">{t("ingredientsIntro")}</p>
              <div className="mb-4 space-y-3">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <Input className="w-24" label={i === 0 ? t("amount") : t("amountN", { n: i + 1 })} hideLabel={i !== 0} type="text" inputMode="decimal"
                      value={ing.amount} onChange={e => updateIngredient(i, "amount", e.target.value)} placeholder="200" />
                    <Input className="w-20" label={i === 0 ? t("unit") : t("unitN", { n: i + 1 })} hideLabel={i !== 0} type="text"
                      value={ing.unit} onChange={e => updateIngredient(i, "unit", e.target.value)} placeholder="g" />
                    <Input className="min-w-0 flex-1" label={i === 0 ? t("ingredient") : t("ingredientN", { n: i + 1 })} hideLabel={i !== 0} type="text"
                      value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)} placeholder={t("ingredientPlaceholder")} autoComplete="off" />
                    <Button variant="icon" icon="trash" aria-label={t("removeIngredient", { n: i + 1 })} onClick={() => removeIngredient(i)} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addIngredient} className={addRowButton}>
                <Icon name="plus" size={18} />
                {t("addIngredient")}
              </button>
            </div>
          )}

          {/* Step 2: Instructions */}
          {step === 2 && (
            <div>
              <p className="mb-4 text-base text-ink-2">{t("instructionsIntro")}</p>
              <div className="mb-4 space-y-6">
                {recipe.instructions.map((inst, i) => (
                  <div key={i} className="border-t border-line pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-h3 tabular">{t("stepN", { n: inst.step })}</h2>
                      <Button variant="quiet" onClick={() => removeInstruction(i)} aria-label={t("removeStep", { n: inst.step })}>{t("remove")}</Button>
                    </div>
                    <Textarea
                      label={t("instructionLabel", { n: inst.step })}
                      hideLabel
                      value={inst.text}
                      onChange={e => updateInstruction(i, "text", e.target.value)}
                      placeholder={t("instructionPlaceholder")}
                      rows={3}
                    />
                    <Input
                      className="mt-3 w-40"
                      label={t("timerLabel")}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={inst.timer_minutes ?? ""}
                      onChange={e => updateInstruction(i, "timer_minutes", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addInstruction} className={addRowButton}>
                <Icon name="plus" size={18} />
                {t("addStep")}
              </button>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <p className="mb-2 text-base font-semibold text-ink">
                  {t("photosLabel")}
                  {recipe.is_public && <span className="ml-2 text-sm font-normal text-ink-3">{t("photosRequired")}</span>}
                </p>
                {recipe.images[0] ? (
                  <>
                    <div
                      ref={previewRef}
                      style={{ cursor: "move" }}
                      className="relative aspect-[3/2] w-full overflow-hidden rounded-2 bg-surface-soft">
                      <img
                        src={recipe.images[0]}
                        alt={t("coverAlt")}
                        draggable={false}
                        onPointerDown={onImgDragStart}
                        onPointerMove={onImgDragMove}
                        onPointerUp={onImgDragEnd}
                        onPointerCancel={onImgDragEnd}
                        style={{ objectPosition: recipe.image_position }}
                        className="absolute inset-0 h-full w-full select-none touch-none object-cover"
                      />
                    </div>
                    <p className="mt-2 text-caption text-ink-3">{t("dragHint")}</p>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-2 border border-dashed border-line-strong text-ink-2 transition-colors hover:bg-surface-soft"
                  >
                    <Icon name="image" size={32} />
                    <span className="text-base font-semibold">{uploading ? t("uploading") : t("uploadPhoto")}</span>
                    <span className="text-caption text-ink-3">{t("uploadHint")}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple className="sr-only" tabIndex={-1} aria-label={t("photoFiles")} onChange={handleImageUpload} />
                {recipe.images.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {recipe.images.map((url, i) => (
                      <li key={url} className="relative">
                        <button
                          type="button"
                          onClick={() => makeCover(i)}
                          aria-label={i === 0 ? t("photoIsCover", { n: i + 1 }) : t("makeCover", { n: i + 1 })}
                          aria-pressed={i === 0}
                          className={`block h-20 w-20 overflow-hidden rounded-2 border-2 ${i === 0 ? "border-brand" : "border-transparent"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                        {i === 0 && <span className="mt-1 block text-caption font-semibold text-brand">{t("cover")}</span>}
                        <Button
                          variant="icon"
                          size="sm"
                          icon="x"
                          aria-label={t("removePhoto", { n: i + 1 })}
                          onClick={() => removeImage(i)}
                          className="absolute -right-3 -top-3 h-8! w-8!"
                        />
                      </li>
                    ))}
                    {recipe.images.length < MAX_IMAGES && (
                      <li>
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                          aria-label={t("addPhoto")}
                          className="flex h-20 w-20 items-center justify-center rounded-2 border border-dashed border-line-strong text-ink-2 transition-colors hover:bg-surface-soft disabled:text-ink-3">
                          <Icon name="plus" size={24} />
                        </button>
                      </li>
                    )}
                  </ul>
                )}
                {recipe.images.length > 1 && (
                  <p className="mt-2 text-caption text-ink-3">{t("galleryHint")}</p>
                )}
              </div>
              <div>
                <Input
                  label={<>{t("videoLabel")} <span className="font-normal text-ink-3">{t("optional")}</span></>}
                  type="url"
                  value={recipe.video_url}
                  onChange={e => setRecipe(p => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  error={videoUrlError ? t("videoError") : undefined}
                  hint={t("videoHint")}
                  autoComplete="url"
                />
                {recipe.video_url && !videoUrlError && <Notice tone="success" className="mt-3">{t("videoAdded")}</Notice>}
              </div>
            </div>
          )}

          {/* Step 4: Publish */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-t border-line pt-4">
                <h2 className="text-h2-sm mb-2">{recipe.title || untitled}</h2>
                <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3 tabular">
                  {recipe.prep_time && <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={16} />{t("prepShort", { min: recipe.prep_time })}</span>}
                  {recipe.cook_time && <span className="inline-flex items-center gap-1.5"><Icon name="flame" size={16} />{t("cookShort", { min: recipe.cook_time })}</span>}
                  {recipe.servings && <span className="inline-flex items-center gap-1.5"><Icon name="users" size={16} />{t("servingsCount", { count: parseInt(recipe.servings) || 0 })}</span>}
                  <span>{t("ingredientsCount", { count: ingredientCount })}</span>
                  <span>{t("stepsCount", { count: stepCount })}</span>
                </p>
                {recipe.tags.length > 0 && <p className="mb-3 text-sm text-ink-2">{recipe.tags.join(", ")}</p>}
                {recipe.images[0] && (
                  <div>
                    <div className="aspect-[3/2] overflow-hidden rounded-2 bg-surface-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={recipe.images[0]} alt="" style={{ objectPosition: recipe.image_position }} className="h-full w-full object-cover" />
                    </div>
                    {recipe.images.length > 1 && <p className="mt-2 text-caption text-ink-3 tabular">{t("photosCount", { count: recipe.images.length })}</p>}
                  </div>
                )}
              </div>

              {recipe.source_type === "imported" ? (
                <div className="border-t border-line pt-4">
                  <h2 className="text-h3">{t("visibility")}</h2>
                  <p className="mt-1 mb-3 flex items-center gap-1.5 text-base text-ink-2"><Icon name="lock" size={18} />{t("importedPrivate")}</p>
                  <Notice tone="info">
                    {t("importedNotice")}
                  </Notice>
                </div>
              ) : (
                <div className="border-t border-line pt-4">
                  <h2 className="text-h3 mb-3">{t("visibility")}</h2>
                  <Checkbox
                    label={t("makePublic")}
                    checked={recipe.is_public}
                    onChange={e => setRecipe(p => ({ ...p, is_public: e.target.checked }))}
                  />
                  <p className="mt-1 pl-8 text-sm text-ink-3">
                    {recipe.is_public
                      ? t("publicHint")
                      : t("privateHint")}
                  </p>
                  {recipe.is_public && (
                    <div className="mt-3 space-y-2">
                      <Notice tone="info">
                        {t("reviewNotice")}
                      </Notice>
                      {!recipe.images.length && (
                        <Notice tone="error">
                          <span>{t("noPhoto")} </span>
                          <button type="button" onClick={() => setStep(3)} className="font-semibold underline underline-offset-[3px]">{t("addPhoto")}</button>
                        </Notice>
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.length > 0 && (
                <Notice tone="error">
                  <p className="font-semibold">{t("cannotPublish")}</p>
                  <ul className="list-disc pl-5">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </Notice>
              )}
            </div>
          )}

          {/* Inline step errors (steps 0–3) */}
          {errors.length > 0 && step < 4 && (
            <Notice tone="error" className="mt-4">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </Notice>
          )}

          {/* Navigation */}
          <div className="mt-8 flex flex-wrap gap-3">
            {step > 0 && (
              <Button variant="secondary" onClick={() => { setErrors([]); setStep(s => s - 1); }}>{t("back")}</Button>
            )}
            {step < STEP_NAMES.length - 1 ? (
              <Button onClick={handleNext}>{t("next")}</Button>
            ) : (
              <Button onClick={handlePublish} loading={saving} disabled={saving || (recipe.is_public && !recipe.images.length)}>
                {recipe.is_public ? t("publish") : t("saveAsDraft")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
