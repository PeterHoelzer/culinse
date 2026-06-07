"use client";
import { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { useRouter } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";

interface Ingredient { name: string; amount: string; unit: string; }
interface Instruction { step: number; text: string; timer_minutes: number | null; }
interface RecipeData {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  image_position: string;
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
  title: "", description: "", image_url: "", image_position: "50% 50%", video_url: "",
  ingredients: [{ name: "", amount: "", unit: "" }],
  instructions: [{ step: 1, text: "", timer_minutes: null }],
  cook_time: "", prep_time: "", servings: "2", tags: [], is_public: false, source_type: "created",
};

function serializeRecipe(data: RecipeData) {
  return {
    title: data.title || "Untitled",
    description: data.description,
    image_url: data.image_url,
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

const STEP_NAMES = ["Basics", "Ingredients", "Instructions", "Media", "Publish"];

interface Props { mode: "create" | "edit"; recipeId?: string; }

export default function RecipeEditorClient({ mode, recipeId }: Props) {
  const router = useRouter();
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
    if (!recipe.image_url) return;
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
    const body = serializeRecipe(data);
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
  }, []);

  useEffect(() => {
    if (!recipe.title && mode === "create") return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveDraft(recipe), 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [recipe, saveDraft, mode]);

  // Per-step validation
  const getStepErrors = (s: number): string[] => {
    if (s === 0 && !recipe.title.trim()) return ["Recipe title is required."];
    if (s === 1 && !recipe.ingredients.some(i => i.name.trim())) return ["Add at least one ingredient."];
    if (s === 2 && !recipe.instructions.some(i => i.text.trim())) return ["Add at least one instruction step."];
    if (s === 3 && recipe.video_url && !isValidVideoUrl(recipe.video_url)) return ["Please enter a valid YouTube or TikTok URL."];
    return [];
  };

  const handleNext = () => {
    const errs = getStepErrors(step);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setStep(s => s + 1);
  };

  // Image upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${(await supabase.auth.getUser()).data.user?.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("recipe-media").upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from("recipe-media").getPublicUrl(data.path);
      setRecipe(prev => ({ ...prev, image_url: publicUrl }));
    }
    setUploading(false);
  };

  const handlePublish = async () => {
    const errs: string[] = [];
    if (!recipe.title.trim()) errs.push("Title is required.");
    if (recipe.is_public && !recipe.image_url) errs.push("A photo is required for public recipes.");
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);
    setErrors([]);
    const method = draftIdRef.current ? "PUT" : "POST";
    const url = draftIdRef.current ? `/api/user-recipes/${draftIdRef.current}` : "/api/user-recipes";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(serializeRecipe(recipe)),
    });
    const d = await res.json();
    if (res.status === 422) { setErrors(d.issues ?? ["Quality check failed"]); setSaving(false); return; }
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
  const removeTag = (tag: string) => setRecipe(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{mode === "create" ? "Create Recipe" : "Edit Recipe"}</h1>
            <p className="text-xs text-gray-400">Step {step + 1} of {STEP_NAMES.length} — {STEP_NAMES[step]}</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-green-500">✓ Saved</span>}
            <button onClick={() => saveDraft(recipe)} className="text-xs text-gray-400 hover:text-gray-600">Save draft</button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="flex gap-1">
            {STEP_NAMES.map((s, i) => (
              <div key={s} onClick={() => i < step && setStep(i)}
                className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-orange-500" : "bg-gray-200"} ${i < step ? "cursor-pointer" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 0: Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe title *</label>
              <input type="text" value={recipe.title} onChange={e => setRecipe(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Grandma's Spaghetti Carbonara"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
              <textarea value={recipe.description} onChange={e => setRecipe(p => ({ ...p, description: e.target.value }))}
                placeholder="What makes this recipe special?"
                rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prep time (min)</label>
                <input type="number" value={recipe.prep_time} onChange={e => setRecipe(p => ({ ...p, prep_time: e.target.value }))}
                  placeholder="15" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cook time (min)</label>
                <input type="number" value={recipe.cook_time} onChange={e => setRecipe(p => ({ ...p, cook_time: e.target.value }))}
                  placeholder="30" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Servings</label>
                <input type="number" value={recipe.servings} onChange={e => setRecipe(p => ({ ...p, servings: e.target.value }))}
                  placeholder="4" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div
                className="flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border border-gray-200 focus-within:border-orange-300 bg-white min-h-[44px] cursor-text"
                onClick={() => document.getElementById("tag-input")?.focus()}>
                {recipe.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                    {tag}
                    <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }} className="hover:text-red-500 leading-none">×</button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={recipe.tags.length === 0 ? "pasta, italian, quick…" : ""}
                  className="flex-1 min-w-[100px] text-sm outline-none bg-transparent py-0.5"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag</p>
            </div>
          </div>
        )}

        {/* Step 1: Ingredients */}
        {step === 1 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Add all ingredients with amounts and units.</p>
            <div className="space-y-2 mb-4">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={ing.amount} onChange={e => updateIngredient(i, "amount", e.target.value)}
                    placeholder="200" className="w-20 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
                  <input type="text" value={ing.unit} onChange={e => updateIngredient(i, "unit", e.target.value)}
                    placeholder="g" className="w-16 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
                  <input type="text" value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)}
                    placeholder="Ingredient name" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300" />
                  <button onClick={() => removeIngredient(i)} className="text-gray-300 hover:text-red-400 text-lg px-1">×</button>
                </div>
              ))}
            </div>
            <button onClick={addIngredient}
              className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors">
              + Add ingredient
            </button>
          </div>
        )}

        {/* Step 2: Instructions */}
        {step === 2 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Write clear step-by-step instructions. Add optional timers for steps that require waiting.</p>
            <div className="space-y-4 mb-4">
              {recipe.instructions.map((inst, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Step {inst.step}</span>
                    <button onClick={() => removeInstruction(i)} className="text-gray-300 hover:text-red-400 text-sm">Remove</button>
                  </div>
                  <textarea value={inst.text} onChange={e => updateInstruction(i, "text", e.target.value)}
                    placeholder="Describe this step clearly..."
                    rows={3} className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-none placeholder-gray-300" />
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">⏱ Timer (optional):</span>
                    <input type="number" value={inst.timer_minutes ?? ""} onChange={e => updateInstruction(i, "timer_minutes", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="–" className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-xs text-center focus:outline-none focus:border-orange-300" />
                    <span className="text-xs text-gray-400">min</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addInstruction}
              className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors">
              + Add step
            </button>
          </div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe photo
                {recipe.is_public && <span className="ml-1 text-xs text-orange-500">* required for public</span>}
              </label>
              <div
                ref={previewRef}
                onClick={recipe.image_url ? undefined : () => fileRef.current?.click()}
                style={{ cursor: recipe.image_url ? "move" : "pointer" }}
                className="relative w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center hover:border-orange-300 transition-colors overflow-hidden">
                {recipe.image_url ? (
                  <>
                    <img
                      src={recipe.image_url}
                      alt="preview"
                      draggable={false}
                      onPointerDown={onImgDragStart}
                      onPointerMove={onImgDragMove}
                      onPointerUp={onImgDragEnd}
                      onPointerCancel={onImgDragEnd}
                      style={{ objectPosition: recipe.image_position }}
                      className="absolute inset-0 w-full h-full object-cover select-none touch-none"
                    />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/55 text-white text-[11px] px-3 py-1 rounded-full pointer-events-none">
                      ✥ Ziehen, um das Bild zu positionieren
                    </div>
                  </>
                ) : uploading ? (
                  <div className="text-sm text-gray-400 animate-pulse">Uploading...</div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-sm text-gray-400">Click to upload a photo</p>
                    <p className="text-xs text-gray-300 mt-1">JPG, PNG, WebP · Max 5 MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {recipe.image_url && (
                <div className="mt-2 flex items-center gap-4">
                  <button onClick={() => fileRef.current?.click()}
                    className="text-xs text-gray-500 hover:text-orange-500">Change photo</button>
                  <button onClick={() => setRecipe(p => ({ ...p, image_url: "", image_position: "50% 50%" }))}
                    className="text-xs text-red-400 hover:text-red-500">Remove photo</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="url" value={recipe.video_url} onChange={e => setRecipe(p => ({ ...p, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... or https://tiktok.com/..."
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${videoUrlError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-orange-300"}`} />
              {videoUrlError ? (
                <p className="text-xs text-red-500 mt-1">Please enter a valid YouTube or TikTok URL.</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Paste a YouTube or TikTok link — it will be embedded on your recipe page.</p>
              )}
              {recipe.video_url && !videoUrlError && (
                <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700">✓ Video link added</div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Publish */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">{recipe.title || "Untitled Recipe"}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                {recipe.prep_time && <span>⏱ Prep: {recipe.prep_time}min</span>}
                {recipe.cook_time && <span>🍳 Cook: {recipe.cook_time}min</span>}
                {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
                <span>📋 {recipe.ingredients.filter(i => i.name).length} ingredients</span>
                <span>📝 {recipe.instructions.filter(i => i.text).length} steps</span>
              </div>
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
              {recipe.image_url && <img src={recipe.image_url} alt="" className="w-full h-32 object-cover rounded-xl" />}
            </div>
            {recipe.source_type === "imported" ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-medium text-gray-900">Visibility</p>
              <p className="text-sm text-gray-500 mt-0.5">🔒 Private — imported recipes stay private to you.</p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                Imported from another site, so it cannot be made public — only recipes you create yourself can be published. You can still cook from it, search it, and add it to your meal plan.
              </div>
            </div>
            ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Visibility</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {recipe.is_public
                      ? "Public — visible to everyone and appears in the discover feed"
                      : "Private — only you can see this recipe"}
                  </p>
                </div>
                <button
                  onClick={() => setRecipe(p => ({ ...p, is_public: !p.is_public }))}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${recipe.is_public ? "bg-orange-500" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${recipe.is_public ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              {recipe.is_public && (
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700">
                    Your recipe will be reviewed against our quality standards: photo required, clear instructions, and a proper title.
                  </div>
                  {!recipe.image_url && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>No photo added — a photo is required to publish publicly.</span>
                      <button onClick={() => setStep(3)} className="underline ml-auto flex-shrink-0">Add photo</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm font-medium text-red-700 mb-1">Cannot publish:</p>
                {errors.map((e, i) => <p key={i} className="text-xs text-red-600">• {e}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Inline step errors (steps 0–3) */}
        {errors.length > 0 && step < 4 && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600">• {e}</p>)}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => { setErrors([]); setStep(s => s - 1); }}
              className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
              ← Back
            </button>
          )}
          {step < STEP_NAMES.length - 1 ? (
            <button onClick={handleNext}
              className="flex-1 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
              Next →
            </button>
          ) : (
            <button onClick={handlePublish} disabled={saving || (recipe.is_public && !recipe.image_url)}
              className="flex-1 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
              {saving ? "Saving..." : recipe.is_public ? "Publish Recipe 🌍" : "Save as Draft 🔒"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
