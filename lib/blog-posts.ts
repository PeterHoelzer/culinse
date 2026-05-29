export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  category: string;
  sections: Section[];
}

interface Section {
  heading?: string;
  content: string;
  list?: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-meal-prep-for-the-week",
    title: "How to Meal Prep for the Week: A Complete Beginner's Guide",
    description:
      "Learn how to meal prep for the week like a pro. Step-by-step guide covering planning, shopping, batch cooking, and storage — save time and money every week.",
    publishedAt: "2026-05-10",
    readingTime: "7 min read",
    category: "Meal Prep",
    sections: [
      {
        content:
          "Meal prepping sounds like a lot of work until you actually try it. Then it becomes one of those habits you wonder how you ever lived without. You spend a couple of hours on Sunday and suddenly weekday lunches and dinners just happen — no scrambling, no 'what do I even make tonight', no ordering takeout because you're too tired to think.",
      },
      {
        content:
          "This guide walks you through everything: how to plan, what to cook, how to shop efficiently, and how to store it all. No complicated recipes required.",
      },
      {
        heading: "Step 1: Decide What You're Prepping",
        content:
          "Most people try to prep too much at first. Start with just one meal category — lunches for the work week, or dinners for Monday through Thursday. That's already a huge win.",
        list: [
          "Lunches only: the easiest entry point. Make 4–5 portions of one dish.",
          "Dinners only: more prep, but saves you the most stressful part of the day.",
          "Both: realistic once you've done it a few times and know your rhythm.",
        ],
      },
      {
        heading: "Step 2: Pick 2–3 Recipes Max",
        content:
          "The biggest mistake beginners make is planning 7 different meals for 7 days. You'll spend 6 hours cooking and hate every minute. Instead, pick 2 or 3 recipes that share ingredients. Eating the same lunch three days in a row sounds boring until you realize you get that time back.",
        list: [
          "Look for recipes that use overlapping ingredients (chicken + rice can go in a dozen directions).",
          "Prioritize things that reheat well: grains, legumes, roasted vegetables, stews, grain bowls.",
          "Avoid things that go soggy: salads with dressing, crispy textures, anything with fresh herbs mixed in.",
        ],
      },
      {
        heading: "Step 3: Make a Proper Shopping List",
        content:
          "This is where most meal prep falls apart. You plan three recipes, go to the store, and forget two ingredients. Or you buy duplicates because you didn't check what you already have.",
        list: [
          "Write the full ingredient list for every recipe before you shop.",
          "Combine amounts: if Recipe A needs 2 garlic cloves and Recipe B needs 4, you need 6 total.",
          "Check your pantry first — you probably already have olive oil, salt, and half the spices.",
          "Sort your list by store section (produce, dairy, meat, dry goods) so you don't zigzag.",
        ],
      },
      {
        content:
          "If combining ingredients from multiple recipes manually sounds tedious — it is. That's exactly why tools like Culinse exist. You add your planned recipes for the week and it automatically generates a combined shopping list sorted by category, with correct combined amounts. Free to use at culinse.com.",
      },
      {
        heading: "Step 4: Set Up Your Kitchen First",
        content:
          "Before you start cooking, spend 5 minutes getting organized. It makes the whole process faster.",
        list: [
          "Clear counter space.",
          "Get all your containers ready — nothing worse than finishing a batch of rice with nowhere to put it.",
          "Read through all your recipes once. Find overlapping steps you can do simultaneously.",
          "Start with things that take longest: roasting vegetables, simmering grains, slow-cooking proteins.",
        ],
      },
      {
        heading: "Step 5: Cook Strategically, Not Sequentially",
        content:
          "The goal is to use all available time in parallel. While rice is cooking, chop vegetables. While vegetables roast, prep the protein. Experienced meal preppers can do a week of food in 90 minutes because they're never standing around waiting.",
        list: [
          "Use your oven, stovetop, and (if you have one) slow cooker or Instant Pot simultaneously.",
          "Batch-cook base ingredients that work in multiple dishes: a big pot of grains, a sheet pan of roasted veg.",
          "Season simply at first — you can always add more flavor when you reheat.",
        ],
      },
      {
        heading: "Step 6: Store Everything Correctly",
        content:
          "Bad storage kills good meal prep. Here's what actually works:",
        list: [
          "Glass containers > plastic for most things. They reheat better and don't absorb smells.",
          "Label with the date if you're meal prepping more than 3 days ahead.",
          "Fridge lifespan: most cooked food lasts 4–5 days. Anything beyond that, freeze it.",
          "Keep sauces and dressings separate until you eat — this stops things going soggy.",
          "Store cut fruit and veg in water-lined containers to keep them fresh longer.",
        ],
      },
      {
        heading: "How Long Should Meal Prep Take?",
        content:
          "Realistically, if you're cooking for one or two people and prepping 3 recipes, you're looking at 1.5 to 2.5 hours. This includes shopping (if you have a good list) or 60–90 minutes if you already shopped. It gets faster each week as you find your rhythm.",
      },
      {
        heading: "Getting Started: Your First Week",
        content:
          "Pick one simple recipe. Make four portions. That's it. Don't over-engineer it the first time.",
        list: [
          "A pot of lentil soup. A big grain salad. Roasted chicken thighs with rice.",
          "Don't buy special containers yet — use what you have.",
          "Set aside two hours on a Sunday. Put on a podcast.",
          "See how much time you save during the week. Then expand.",
        ],
      },
      {
        content:
          "The hardest part of meal prepping is doing it the first time. After that, it becomes routine. The planning gets faster, the shopping gets smarter, and the cooking gets easier. Start simple, stay consistent, and adjust as you go.",
      },
    ],
  },
  {
    slug: "best-free-meal-planner-apps-2026",
    title: "The Best Free Meal Planner Apps in 2026",
    description:
      "Looking for a free meal planner? We compare the best free meal planning apps in 2026 — features, limits, and which one is right for your cooking style.",
    publishedAt: "2026-05-12",
    readingTime: "6 min read",
    category: "Tools & Apps",
    sections: [
      {
        content:
          "A good meal planner should do one thing well: take the decision fatigue out of what you're eating this week. In practice, most apps fall short of that. They're either too complicated, too limited in their free tier, or they don't solve the actual problem — which is the shopping list.",
      },
      {
        content:
          "Here's an honest look at the best free meal planner apps available in 2026, what each one is good at, and where each one falls short.",
      },
      {
        heading: "What to Look for in a Meal Planner",
        content:
          "Before getting into the list, here are the features that actually matter:",
        list: [
          "Weekly grid view: being able to see the whole week at once (Mon–Sun, breakfast/lunch/dinner) is essential for real planning.",
          "Automatic shopping list: manually writing a shopping list defeats the purpose. The app should generate it for you.",
          "Ingredient combining: if two recipes use garlic, the shopping list should say '6 cloves' not 'garlic' twice.",
          "Recipe library: you want to plan from recipes you actually want to cook, not just generic suggestions.",
          "No paywall on core features: if the shopping list is behind a paywall, it's not really a free meal planner.",
        ],
      },
      {
        heading: "1. Culinse — Best for Shopping List Generation",
        content:
          "Culinse (culinse.com) takes a different approach from most meal planners. Instead of a recipe database you have to use, it pulls recipes from multiple sources (Spoonacular, MealDB, Edamam, Tasty) so you're working with a huge variety. You plan your week in a 7×3 grid and the app automatically generates a combined, categorized shopping list.",
        list: [
          "Free tier: recipe discovery and saving recipes.",
          "Pro (€4.99/mo): full week planner, auto shopping list, collections.",
          "Best for: people who want a clean planning interface and a proper shopping list.",
          "Works in the browser — no app download needed.",
        ],
      },
      {
        heading: "2. Mealime — Best for Dietary Preferences",
        content:
          "Mealime is one of the most polished meal planning apps available. It asks for your dietary preferences upfront and then suggests weekly menus based on them. The free tier is fairly generous.",
        list: [
          "Free tier includes a limited recipe library and basic planning.",
          "Shopping list is included but less customizable.",
          "Best for: people who want curated suggestions rather than open-ended browsing.",
          "Paid tier unlocks more recipes and customization.",
        ],
      },
      {
        heading: "3. Paprika — Best for Recipe Clipping",
        content:
          "Paprika is technically a recipe manager, not a meal planner, but the meal planning module is solid. The killer feature is the browser extension that lets you clip recipes from any website.",
        list: [
          "One-time purchase (~$5), not a subscription.",
          "Recipe clipping from any URL is the standout feature.",
          "Shopping list is good but doesn't combine ingredients across recipes as well as dedicated tools.",
          "Best for: people with large recipe collections who want to plan from their own saves.",
        ],
      },
      {
        heading: "4. Google Sheets — Most Flexible (DIY)",
        content:
          "For people who want full control, a custom Google Sheets template beats most apps on flexibility. You can build exactly the planning view you want.",
        list: [
          "Completely free.",
          "No automatic shopping list — you build what you build.",
          "High setup effort, but once it's built it's yours.",
          "Best for: people who like to customize everything and don't mind the setup time.",
        ],
      },
      {
        heading: "5. Plan to Eat — Best for Families",
        content:
          "Plan to Eat is aimed at families and serious home cooks. It's well-designed and the drag-and-drop calendar is satisfying to use.",
        list: [
          "Free trial for 30 days, then paid only.",
          "Shopping list is excellent — one of the best implementations.",
          "Best for: families planning multiple meals per day, not casual solo planners.",
        ],
      },
      {
        heading: "Which One Should You Use?",
        content:
          "It depends what you're optimizing for:",
        list: [
          "Just getting started with meal planning → Mealime or Culinse. Both are easy to use without setup.",
          "You want to plan from your own recipes → Paprika.",
          "Shopping list is the priority → Culinse or Plan to Eat.",
          "You want full flexibility → Google Sheets.",
          "Family with complex needs → Plan to Eat.",
        ],
      },
      {
        content:
          "Most people try two or three before sticking with one. The best meal planner is ultimately the one you'll actually use consistently — and that usually means the one that makes the shopping list easy.",
      },
    ],
  },
  {
    slug: "weekly-meal-plan-with-shopping-list",
    title: "How to Create a Weekly Meal Plan with an Automatic Shopping List",
    description:
      "Stop writing shopping lists by hand. Learn how to build a complete weekly meal plan that generates your grocery list automatically — saving time every single week.",
    publishedAt: "2026-05-14",
    readingTime: "5 min read",
    category: "Meal Planning",
    sections: [
      {
        content:
          "The shopping list is the part of meal planning that takes the most time and causes the most frustration. You plan five recipes, then spend 20 minutes going through each one, writing down ingredients, trying to remember what you already have, and inevitably forgetting something.",
      },
      {
        content:
          "There's a better way. If you use a meal planner that automatically generates a combined shopping list from your planned recipes, the whole process takes a fraction of the time. Here's how to set it up.",
      },
      {
        heading: "The Problem with Manual Shopping Lists",
        content:
          "When you're planning from multiple recipes, there are three problems with writing the shopping list by hand:",
        list: [
          "Duplication: if three recipes use garlic, you write garlic three times instead of combining the amounts.",
          "Time: going through 4–5 recipes ingredient by ingredient is slow.",
          "Errors: it's easy to miss an ingredient or write down the wrong amount.",
        ],
      },
      {
        content:
          "An automatic shopping list solves all three. You tell the app what you're cooking this week, and it figures out exactly what to buy — combined amounts, no duplicates, sorted by category so you can move through the store efficiently.",
      },
      {
        heading: "Step 1: Plan Your Week First",
        content:
          "Before any shopping list, you need a weekly plan. The most useful format is a 7×3 grid — seven days across the top, breakfast/lunch/dinner down the side. You don't have to fill every cell. Most people plan dinners at minimum, add lunches if they meal prep, and leave breakfast flexible.",
        list: [
          "Start with dinners — those are the most time-consuming and most worth planning.",
          "Add lunches if you're meal prepping for work.",
          "Don't over-plan. 4–5 planned meals is realistic. Leave room for leftovers and flexible days.",
        ],
      },
      {
        heading: "Step 2: Choose Recipes That Share Ingredients",
        content:
          "One of the underrated tricks of meal planning is ingredient overlap. If you can plan a week where garlic, onions, olive oil, and chicken appear in multiple recipes, your shopping list gets shorter and cheaper.",
        list: [
          "Pick a protein and use it two ways: chicken thighs on Monday, chicken in a stir fry on Wednesday.",
          "Plan one big batch of grains (rice, quinoa) that works across multiple meals.",
          "Roast a big sheet of vegetables — they work as a side dish, in a grain bowl, or stirred into pasta.",
        ],
      },
      {
        heading: "Step 3: Let the App Generate the Shopping List",
        content:
          "Once your week is planned, the shopping list should happen automatically. A good meal planning tool combines all the ingredients from your planned recipes, adds up the amounts (so '2 cloves garlic' from three recipes becomes '6 cloves garlic'), and sorts everything by grocery store section.",
        list: [
          "Produce: all your fresh vegetables and fruit together.",
          "Meat & fish: your proteins for the week.",
          "Dairy & eggs: anything from the cold section.",
          "Dry goods & pantry: grains, canned goods, oils, spices.",
          "Frozen: anything from the freezer aisle.",
        ],
      },
      {
        content:
          "Culinse does exactly this. You plan your week in a 7×3 grid, pick recipes from a large cross-source library, and the shopping list is generated automatically with combined amounts sorted by category. You can then check off items as you shop. Free at culinse.com.",
      },
      {
        heading: "Step 4: Review Before You Shop",
        content:
          "Before heading to the store, take 2 minutes to check the list against your pantry. Cross off anything you already have. This is much faster than doing it recipe by recipe — you're looking at one consolidated list, not flipping between five pages.",
        list: [
          "Check spices and condiments first — these are the ones most likely to be duplicated.",
          "Look at quantities: if the list says '1 can coconut milk' but your recipe calls for most of a can, you might want to get two.",
          "Note anything with short shelf life — plan those recipes early in the week.",
        ],
      },
      {
        heading: "The Result: 10 Minutes of Planning Per Week",
        content:
          "Once you have a system, weekly meal planning with a proper shopping list takes about 10–15 minutes. Pick your recipes, drag them into the weekly grid, review the generated list, check your pantry, go shopping. During the week you cook from a plan instead of deciding on the fly.",
      },
      {
        content:
          "The time investment pays off every single day — no more 'what's for dinner' decision fatigue, no more forgotten ingredients, and significantly less food waste because you're buying what you'll actually use.",
      },
    ],
  },
  {
    slug: "easy-dinner-ideas-for-busy-weeknights",
    title: "15 Easy Dinner Ideas for Busy Weeknights (Ready in 30 Minutes or Less)",
    description:
      "Stuck on what to cook tonight? These easy dinner ideas come together in 30 minutes or less — no complicated steps, no obscure ingredients, just real food that actually works on busy weeknights.",
    publishedAt: "2026-05-28",
    readingTime: "6 min read",
    category: "Dinner Ideas",
    sections: [
      {
        content:
          "It's 6 pm. You just got home, everyone's hungry, and your brain is completely empty. This is when dinner planning either pays off or falls apart. If you planned ahead, you pull something together in 30 minutes. If you didn't, you're staring into the fridge wondering if cheese and crackers counts as dinner.",
      },
      {
        content:
          "These 15 easy dinner ideas are the kind of weeknight meals that actually work — fast, filling, and made from things you can keep on hand. No elaborate prep, no 45-minute recipes dressed up as 'quick', just straightforward food that gets dinner on the table.",
      },
      {
        heading: "10–15 Minute Dinners",
        content:
          "When time is really tight, these come together almost faster than ordering takeout:",
        list: [
          "Fried rice: leftover rice, eggs, soy sauce, any vegetables you have. 10 minutes.",
          "Scrambled eggs with toast and a side salad: underrated as a dinner, fast, protein-rich.",
          "Quesadillas: tortilla, cheese, beans or leftover chicken, 5 minutes per side.",
          "Pasta aglio e olio: spaghetti, garlic, olive oil, chili flakes, parmesan. 15 minutes from dry pasta.",
          "Tuna salad wraps: canned tuna, mayo, celery, lettuce, wrap it up.",
        ],
      },
      {
        heading: "20–30 Minute Dinners",
        content:
          "The sweet spot for weeknight cooking — enough time to make something that actually feels like a meal:",
        list: [
          "Sheet pan chicken thighs with roasted vegetables: everything on one pan at 220°C, 25 minutes.",
          "Stir-fried noodles: noodles, protein of choice, vegetables, soy sauce, sesame oil. Faster than it sounds.",
          "Black bean tacos: canned black beans seasoned with cumin and chili, avocado, lime, 15 minutes.",
          "One-pan salmon with green beans: season salmon, add beans to the pan, done in 20 minutes.",
          "Turkey or chicken meatballs with pasta: pre-formed, bake while pasta cooks.",
          "Chickpea curry: canned chickpeas, canned tomatoes, coconut milk, curry paste. 20 minutes, genuinely good.",
          "Halloumi with couscous and roasted peppers: couscous is done in 5 minutes, halloumi fries fast.",
          "Greek-style ground beef with pita: seasoned beef, cucumber, tomato, yogurt sauce.",
          "Lentil soup: red lentils cook in 20 minutes, no soaking. Onion, cumin, garlic, vegetable stock.",
          "Flatbread pizza: store-bought flatbread, tomato sauce, mozzarella, whatever toppings. 12 minutes at 200°C.",
        ],
      },
      {
        heading: "The Real Secret: Keeping the Right Things Stocked",
        content:
          "Most of these recipes work because they rely on pantry staples and freezer basics. If you consistently have these on hand, you can always put something together:",
        list: [
          "Canned: chickpeas, black beans, diced tomatoes, coconut milk, tuna",
          "Dry: pasta, rice, couscous, red lentils, noodles",
          "Freezer: chicken thighs, ground meat, edamame, frozen vegetables",
          "Fridge constants: eggs, parmesan, Greek yogurt, a block of halloumi or feta",
          "Condiments: soy sauce, olive oil, curry paste, hot sauce",
        ],
      },
      {
        content:
          "When you have these basics, you can make something out of almost nothing. The recipes above are just starting points — most of them work with whatever protein or vegetable you have on hand.",
      },
      {
        heading: "Plan Once, Cook All Week",
        content:
          "The biggest time-saver isn't faster recipes — it's not having to decide what to cook every day. If you spend 10 minutes on Sunday planning your week and generating a single shopping list, you eliminate the '6 pm empty brain' problem entirely.",
      },
      {
        content:
          "Culinse lets you plan your week in a simple grid, pick recipes from a large library, and generates a combined shopping list automatically — sorted by category, with correct amounts. Free at culinse.com.",
      },
    ],
  },
  {
    slug: "quick-dinner-recipes-under-30-minutes",
    title: "Quick Dinner Recipes Under 30 Minutes: What Actually Works",
    description:
      "Most '30-minute recipes' secretly take 45. Here are quick dinner recipes that genuinely come together fast — with tips on how to make weeknight cooking reliably quick every time.",
    publishedAt: "2026-05-28",
    readingTime: "5 min read",
    category: "Dinner Ideas",
    sections: [
      {
        content:
          "You've probably been burned by the 30-minute recipe myth. The prep alone takes 20 minutes, and somewhere between 'quickly dice the onion' and 'reduce the sauce until glossy' the clock hits 55 minutes and you're eating at 8 pm.",
      },
      {
        content:
          "Genuinely quick dinner recipes share a few characteristics that have nothing to do with how they're marketed. Here's what to look for — and a set of recipes that actually deliver.",
      },
      {
        heading: "What Makes a Recipe Actually Fast",
        content:
          "The bottleneck is almost never cooking time — it's prep. A recipe is fast when:",
        list: [
          "It uses minimal knife work: canned beans and tomatoes are already 'prepped'.",
          "Cooking happens in one pan: fewer dishes, no parallel timing to manage.",
          "Protein is naturally quick: eggs, shrimp, fish fillets, canned legumes all cook in under 10 minutes.",
          "It doesn't require deglazing, reducing, or emulsifying: those steps sound easy but add 10–15 minutes.",
        ],
      },
      {
        heading: "Recipes That Genuinely Take Under 30 Minutes",
        content: "These hold up even when you're tired and moving slowly:",
        list: [
          "Shrimp stir-fry with rice (use pre-cooked or microwave rice): shrimp cook in 3–4 minutes, sauce comes together in 2.",
          "Frittata: whisk eggs, pour into oven-safe pan with whatever vegetables/cheese you have, 12 minutes at 200°C.",
          "White bean and spinach soup: canned beans, vegetable stock, garlic, lemon. Ready in 15 minutes.",
          "Pesto pasta with cherry tomatoes: pasta cooks, toss with jarred pesto and halved tomatoes. 15 minutes.",
          "Fish tacos: white fish fillets take 8 minutes in a pan, build the taco while they cook.",
          "Caprese chicken: flatten chicken breasts, pan-fry 7 minutes per side, top with mozzarella and tomato.",
          "Turkish eggs (çilbir): poach eggs in spiced yogurt, finish with brown butter. Sounds impressive, takes 12 minutes.",
          "Soba noodle salad: cook noodles 4 minutes, toss with soy-sesame dressing, sliced cucumber, edamame.",
        ],
      },
      {
        heading: "The Prep Shortcuts That Change Everything",
        content:
          "Beyond choosing the right recipes, a few prep habits cut weeknight cooking time significantly:",
        list: [
          "Keep pre-cooked grains in the fridge: cook a big batch of rice or quinoa on Sunday. Reheats in 2 minutes.",
          "Use canned and frozen: canned beans, frozen edamame, frozen spinach — no prep at all.",
          "Buy pre-cut vegetables when it matters: frozen stir-fry mixes, pre-shredded cabbage for slaws.",
          "Mise en place before you heat the pan: 3 minutes of prep before cooking makes everything go faster and less stressful.",
        ],
      },
      {
        heading: "Why Planning Beats Speed",
        content:
          "Even the fastest recipe requires a trip to the store if you're missing ingredients. The real speed hack for weeknight dinners isn't finding faster recipes — it's planning 3–4 meals ahead of time and shopping once for all of them.",
      },
      {
        content:
          "When you have the right ingredients at home, you can cook any of these in under 30 minutes without thinking. Culinse helps you plan the week and generates the shopping list automatically — so the ingredients are there when you need them. Free at culinse.com.",
      },
    ],
  },
  {
    slug: "high-protein-meals-for-muscle-building",
    title: "High Protein Meals for Muscle Building: 10 Easy Recipes",
    description: "Build muscle with these high protein meal ideas. Simple, delicious recipes packed with protein — perfect for gym-goers and athletes looking to eat smarter.",
    publishedAt: "2026-05-28",
    readingTime: "6 min read",
    category: "Nutrition",
    sections: [
      {
        content: "If you're training consistently but not seeing the results you want, your diet is probably the missing piece. Protein is the most important macronutrient for building and repairing muscle — and most people dramatically underestimate how much they actually need.",
      },
      {
        content: "The general recommendation for people actively trying to build muscle is 1.6 to 2.2 grams of protein per kilogram of body weight per day. For a 75kg person, that's 120 to 165 grams of protein daily. That takes some planning — but it doesn't have to be complicated.",
      },
      {
        heading: "The Best High-Protein Foods",
        content: "Before we get into recipes, here's what you should be stocking regularly:",
        list: [
          "Chicken breast (31g protein per 100g) — the classic for a reason",
          "Greek yoghurt (10g per 100g) — works for breakfast, sauces, and snacks",
          "Eggs (6g each) — cheap, versatile, and fast",
          "Canned tuna (25g per 100g) — no cooking required",
          "Cottage cheese (12g per 100g) — underrated and filling",
          "Lentils (9g per 100g cooked) — great plant-based option",
          "Tofu (8g per 100g) — absorbs flavours beautifully when cooked right",
        ],
      },
      {
        heading: "10 High Protein Meal Ideas",
        content: "These meals are designed to be quick, satisfying, and genuinely tasty — not just functional:",
        list: [
          "Chicken and rice bowl with teriyaki sauce and edamame",
          "Greek yoghurt breakfast bowl with berries, granola, and hemp seeds",
          "Tuna pasta with olive oil, capers, and cherry tomatoes",
          "Egg and vegetable scramble with cottage cheese stirred in",
          "Lentil and spinach soup with a slice of sourdough",
          "Grilled salmon with quinoa and roasted asparagus",
          "Turkey meatballs with courgette noodles and tomato sauce",
          "Black bean tacos with avocado and lime crema",
          "Overnight oats with protein powder, banana, and almond butter",
          "Steak stir-fry with broccoli, peppers, and brown rice",
        ],
      },
      {
        heading: "How to Hit Your Protein Target Every Day",
        content: "The trick is distribution — spreading protein across every meal rather than trying to cram it all into dinner. Aim for 30 to 40 grams per meal and 15 to 20 grams in snacks. That rhythm becomes automatic after a few weeks.",
      },
      {
        content: "Use Culinse to filter recipes by high protein content and build a weekly rotation that keeps you on track. Once you have five or six go-to meals, hitting your target becomes easy — it's just a matter of cooking them in rotation.",
      },
    ],
  },
  {
    slug: "vegetarian-dinner-ideas-easy-recipes",
    title: "20 Vegetarian Dinner Ideas That Are Actually Satisfying",
    description: "Looking for easy vegetarian dinner ideas? These 20 plant-based recipes are hearty, flavourful, and quick to make — even for non-vegetarians.",
    publishedAt: "2026-05-28",
    readingTime: "7 min read",
    category: "Vegetarian",
    sections: [
      {
        content: "The biggest complaint people have about vegetarian food is that it doesn't fill them up. That's almost always a protein and fat issue, not a meat issue. Once you understand how to build a properly balanced vegetarian plate, you stop missing anything.",
      },
      {
        heading: "The Formula for a Satisfying Vegetarian Dinner",
        content: "Every meal needs three things to keep you full: a protein source, a complex carbohydrate, and enough fat to slow digestion. For vegetarian cooking, that means:",
        list: [
          "Protein: lentils, chickpeas, beans, tofu, tempeh, eggs, halloumi, paneer",
          "Carbs: brown rice, quinoa, sweet potato, whole-grain pasta, bread",
          "Fat: olive oil, avocado, nuts, cheese, coconut milk",
        ],
      },
      {
        heading: "20 Vegetarian Dinners Worth Making",
        content: "From quick weeknight meals to weekend cooking projects:",
        list: [
          "Chickpea curry with coconut milk and brown rice",
          "Mushroom and lentil shepherd's pie",
          "Black bean enchiladas with salsa verde",
          "Halloumi and vegetable traybake",
          "Pasta e fagioli (Italian pasta and bean soup)",
          "Tofu pad thai with peanuts and lime",
          "Sweet potato and black bean tacos",
          "Paneer tikka masala with naan",
          "Roasted vegetable and feta quiche",
          "Lentil bolognese with spaghetti",
          "Cauliflower fried rice with egg",
          "Greek-style stuffed peppers with feta and herbs",
          "Courgette and ricotta fritters",
          "Mushroom risotto with parmesan",
          "Spinach and chickpea stew (Chana palak)",
          "Aubergine parmigiana",
          "Tempeh stir-fry with sesame and ginger",
          "Butternut squash soup with crusty bread",
          "Shakshuka (eggs poached in spiced tomato sauce)",
          "Beetroot and goat's cheese flatbread",
        ],
      },
      {
        heading: "Tips for Making Vegetarian Food More Flavourful",
        content: "Meat carries flavour through fat and umami. To replicate that in vegetarian cooking, lean into: caramelisation (don't rush the onions), umami-rich ingredients (miso, soy sauce, parmesan, sun-dried tomatoes, mushrooms), and layered spicing. Toast your spices. Use enough salt. Finish with acid — a squeeze of lemon or a splash of vinegar transforms most dishes.",
      },
      {
        content: "Culinse lets you filter specifically for vegetarian recipes across dozens of food sites. Browse by cuisine, cooking time, and dietary restriction — all in one place.",
      },
    ],
  },
  {
    slug: "mediterranean-diet-recipes-beginners",
    title: "Mediterranean Diet Recipes for Beginners: Start Here",
    description: "New to the Mediterranean diet? These easy recipes and simple principles will help you eat better, feel better, and actually enjoy the food.",
    publishedAt: "2026-05-29",
    readingTime: "6 min read",
    category: "Healthy Eating",
    sections: [
      {
        content: "The Mediterranean diet keeps topping nutrition rankings — not because of clever marketing, but because the evidence is unusually consistent. It's associated with lower rates of heart disease, better cognitive function, and longer life expectancy. And unlike most diets, it's genuinely enjoyable to eat.",
      },
      {
        heading: "What the Mediterranean Diet Actually Is",
        content: "It's not a strict protocol. It's more of a pattern of eating based on what people in southern Europe have eaten for generations:",
        list: [
          "Lots of vegetables, fruit, whole grains, and legumes",
          "Olive oil as the primary fat",
          "Fish and seafood at least twice a week",
          "Moderate amounts of dairy (mainly yoghurt and cheese)",
          "Eggs, poultry, and red meat in smaller quantities",
          "Very little processed food or added sugar",
          "Wine occasionally, with meals (optional)",
        ],
      },
      {
        heading: "5 Easy Recipes to Start With",
        content: "These recipes are approachable, quick, and representative of the style:",
        list: [
          "Greek salad with olives, feta, cucumber, tomato, and olive oil — no dressing needed",
          "Baked salmon with lemon, capers, and fresh dill on a bed of couscous",
          "Lentil soup with carrots, celery, cumin, and a drizzle of olive oil",
          "Shakshuka — eggs in spiced tomato sauce, eaten with crusty bread",
          "Pasta with anchovies, garlic, cherry tomatoes, and parsley",
        ],
      },
      {
        heading: "Pantry Staples to Stock",
        content: "Once you have these in your kitchen, Mediterranean cooking becomes effortless:",
        list: [
          "Extra virgin olive oil — don't scrimp on quality",
          "Canned tomatoes, chickpeas, lentils, and cannellini beans",
          "Dried pasta, couscous, and brown rice",
          "Kalamata olives, capers, and sun-dried tomatoes",
          "Dried herbs: oregano, thyme, rosemary, cumin, smoked paprika",
          "Feta cheese and Greek yoghurt",
          "Tinned sardines, mackerel, and anchovies",
        ],
      },
      {
        heading: "One Simple Rule",
        content: "If you take one thing from the Mediterranean approach: cook from whole ingredients, use olive oil, and eat more vegetables than anything else. Everything else is detail.",
      },
      {
        content: "Use Culinse to search for Mediterranean recipes filtered by your dietary preferences and time. The cuisine filter makes it easy to explore Greek, Italian, Turkish, and Spanish cooking all in one place.",
      },
    ],
  },
  {
    slug: "budget-meals-under-5-euros",
    title: "Budget Meals Under €5: Cheap, Filling, and Actually Good",
    description: "Eating well on a tight budget is possible. These cheap meal ideas cost under €5 per serving and taste great — no sad sandwiches required.",
    publishedAt: "2026-05-29",
    readingTime: "5 min read",
    category: "Budget Cooking",
    sections: [
      {
        content: "Eating cheaply and eating well are not mutually exclusive. The most nutritious foods on earth — lentils, eggs, oats, cabbage, tinned fish — are also some of the cheapest. The problem is that nobody teaches you how to cook them well.",
      },
      {
        heading: "The Cheapest Nutritious Ingredients",
        content: "These are the building blocks of budget cooking. Buy them regularly and your meal costs drop dramatically:",
        list: [
          "Dried lentils (under €2/kg, makes 8+ portions)",
          "Eggs (around €0.25 each, complete protein)",
          "Oats (breakfast sorted for €1.50/week)",
          "Canned chickpeas and beans (€0.60–0.80 per can)",
          "Frozen vegetables (often more nutritious than fresh, and cheaper)",
          "Seasonal vegetables (cabbage, carrots, onions, potatoes — all under €1/kg)",
          "Tinned sardines and mackerel (€1–1.50 per tin, high in omega-3)",
          "Pasta and rice (under €1/kg)",
        ],
      },
      {
        heading: "10 Meals Under €5",
        content: "Each of these costs well under €5 per serving when made at home:",
        list: [
          "Lentil soup with carrots and cumin — roughly €0.90 per bowl",
          "Egg fried rice with frozen vegetables — around €1.20",
          "Chickpea and spinach curry with rice — about €1.50",
          "Pasta with tinned sardines, garlic, and chilli — €1.80",
          "Bean chilli with rice and soured cream — €2.00",
          "Potato and leek soup with bread — €1.50",
          "Vegetable omelette with leftover roasted veg — €1.20",
          "Overnight oats with banana and peanut butter — €0.90",
          "Cabbage and pork stir-fry with noodles — €2.50",
          "Dal makhani (butter lentils) with naan — €1.80",
        ],
      },
      {
        heading: "The Real Budget Cooking Skill: Batch Cooking",
        content: "The most effective way to eat cheaply is to cook in large quantities. A pot of lentil soup costs €5 to make and feeds you for three days. That's €1.70 a meal. If you cook twice a week and eat the same thing for two or three days, your weekly food bill drops by 40–60% without any sacrifice in quality.",
      },
      {
        content: "Browse Culinse to find budget-friendly recipes filtered by ingredients you already have. The meal planner feature helps you plan the whole week in advance so nothing goes to waste.",
      },
    ],
  },

];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
