  On reference imagery — what specifically:                                                                                         
  - Screenshots of real mobile apps you admire (not websites — mobile patterns are different). App Store previews work; in-hand
  screenshots are better.                                                                                                           
  - Mobbin (mobbin.com) is the high-leverage shortcut here — it's a library of real mobile-app screens tagged by pattern. You can
  pull 10 "AI chat with cards" references in 5 minutes instead of hunting.                                                          
  - Motion references — short screen recordings (or Dribbble shots) for transitions, especially the swipe-rotation. Static images   
  won't capture feel.                                                                                                            
  - Illustration / iconography style refs if you want a distinctive visual language — an illustrator's portfolio, a type foundry    
  page, a game UI you like.                                                                                                     
  - Aim for 3–5 refs total, not 20. More references = regression to the mean.                                                       
                                                                             
  One thing to correct in your mental model:                                                                                        
  Claude Design doesn't inherently respect your semantic token naming — you have to tell it in the brief: "use these token names:   
  PrimarySurface, FocusObject, QuestCard, etc." Otherwise it will default to appearance-based names (bgPrimary, blueButton). This   
  goes in the brief as an explicit rule, not an assumption.                                                                         
                                                                                                                                    
  Re: references in Claude Code — yes, but more than just references:                                                               
  
  The handoff from Claude Design to Claude Code should include three artifacts, not one:                                            
  1. Tokens as code — a tokens.ts file (colors, spacing, type scale) using your semantic names. This is the literal code Claude Code
   consumes.                                                                                                                        
  2. Rendered mockups as images — PNGs/screenshots of each screen and card composition. These are the visual target Claude Code
  checks its work against. Tokens don't capture density, hierarchy, or composition; mockups do.                                     
  3. The original reference imagery — passed through, so Claude Code understands the aesthetic intent if it needs to fill gaps      
  (e.g., designing a 5th card type later that Claude Design didn't cover).                                                    
                                                                                                                                    
  So the useful reframe on HTML output:                  
  Don't ingest it as code — but if Claude Design gives you an HTML preview, screenshot it and use those screenshots as the mockups  
  in artifact #2. The HTML becomes a mockup generator, not source code. This is the actual pragmatic workflow.



  The north star for all of them: "intentional, not busy." Calm, spacious, grounded. Every reference should pass the test "does this feel like something a tired 
  adult would exhale at, not something that's trying to sell them productivity?"                                                                                 
                                                                                                                                                                 
  ---                                                                                                                                                            
  1. Palette / mood — what the app feels like at a glance                                                                                                        
                                                                                                                                                                 
  What it is: one screenshot whose overall emotional temperature matches Intently. Not "I like these colors" — "this feels like the inside of my app."
                                                                                                                                                                 
  What to look for:                                      
  - Dominantly warm neutrals (warm whites, bone, sand, soft charcoal) OR deep calm darks (not pure black, not flat gray — something with a tint)                 
  - One accent color doing work across the whole screen, not three                                                                                               
  - Lots of breathing room (negative space > 50% of the frame)    
  - Muted saturation — colors feel "sipped" not "shouted"                                                                                                        
                                                                                                                                                                 
  What to reject:                                                                                                                                                
  - Gradient backgrounds (especially purple-pink-blue — that's the "AI aesthetic" we're rejecting)                                                               
  - Bright primaries, neon accents, "vibrant" anything                                                                                                           
  - Glossy / glassmorphism / heavy blur                  
  - Anthropic orange, Notion/Linear gray-on-white — those are opinionated in the wrong direction                                                                 
                                                                                                                                                                 
  Where to find it: Mobbin → filter by "Journaling" or "Meditation" or "Reading." Apps to look at: Day One, Stoic, Things 3, Oak, Reflect, Bear, iA Writer,      
  Streaks (ironically — the calm ones). On Dribbble: search "calm mobile app," filter by shots with >1000 likes only.                                            
                                                                                                                                                                 
  ---                                                                                                                                                            
  2. Typography / hierarchy — how text breathes on the page
                                                           
  What it is: a screenshot that's mostly text, where you can instantly see what's important without reading a word. This is load-bearing for Intently because
  Markdown rendering is most of your UI. Journal entries, daily briefings, goal lists — it's all typography.                                                     
  
  What to look for:                                                                                                                                              
  - Clear weight contrast: headings feel heavier and smaller-than-you'd-expect, body text has generous line-height (1.5×+ leading)
  - Tight caption/metadata text (timestamps, labels) in a muted color, not smaller-and-louder                                                                    
  - Generous left/right margins on body text — lines don't run the full screen width         
  - Headings have air above them, not just big font size                                                                                                         
  - At most 2 font weights on a screen (regular + semibold is usually enough)                                                                                    
                                                                                                                                                                 
  What to reject:                                                                                                                                                
  - All-caps labels everywhere                                                                                                                                   
  - Tiny body text with huge headings (dramatic contrast = visually loud)                                                                                        
  - Decorative/serif body fonts that are hard to scan (serif headings are fine, sometimes great)
  - Anything with >2 colors of text                                                                                                                              
                                                                                                                                                                 
  Where to find it: any long-form reading/writing app. Reference candidates: iA Writer, Bear, Kindle app's reading mode, Matter, Readwise Reader, Craft Docs,    
  Obsidian Mobile in reading mode, Medium (their mobile reader). The NYT app's article view is also very good.                                                   
                                                                                                                                                                 
  ---                                                                                                                                                            
  3. Card composition — how one unit of information is laid out
                                                                                                                                                                 
  What it is: one screenshot showing a single content card in detail. This is the template you'll reuse for Tracker Card, Plan Card, Journal Card, and
  Confirmation Card — so the structure matters more than what's inside.                                                                                          
                                                         
  What to look for:                                                                                                                                              
  - Clear vertical rhythm: heading → state/meta → body → action row. Not a grid of stuff.
  - Action affordances (buttons, taps) live in a consistent place — usually the bottom row or trailing edge                                                      
  - A primary action and a secondary action are visually distinct — one clearly "louder"                   
  - Status indicators (a dot, a chip, a progress bar) live near the heading, not floating                                                                        
  - The card has one focal point, not three competing ones                                                                                                       
  - Good padding inside the card — content doesn't touch the edges                                                                                               
                                                                                                                                                                 
  What to reject:                                                                                                                                                
  - Cards with a header image (our cards are content, not media)                                                                                                 
  - Cards with 4+ action buttons in a row                                                                                                                        
  - Drop-shadow heavy "floating" cards (we want calm, not dimensional)
  - Outlined-only cards with no fill (looks cheap on mobile)                                                                                                     
                                                                                                                                                                 
  Where to find it: Mobbin → search pattern "Card" filtered by mobile. Reference candidates: Things 3's project cards, Linear mobile's issue cards, Arc Search's 
  result cards, Superhuman's email rows (cards-as-list), Granola's note cards. The Cash App "activity" row is also instructive for the "heading / state / meta / 
  body" composition at small scale.                                                                                                                              
                                                                                                                                                                 
  The most important one to get right: your Confirmation Card is the trust surface — the [Undo] affordance is the whole thesis. Find a reference where a         
  secondary action (like "undo," "dismiss," "archive") is findable without being garish. Mail.app's undo-send toast is a classic; Todoist's completion toast is
  another.                                                                                                                                                       
                                                         
  ---
  4. Motion / transition (optional, but useful)
                                                                                                                                                                 
  What it is: a short video or GIF showing how elements arrive on screen and how screens transition. Your three-screen swipe and your "agent updates a card"
  moment both live or die on motion.                                                                                                                             
                                                         
  What to look for:                                                                                                                                              
  - Transitions under 300ms — anything slower feels sluggish on mobile
  - Easing that decelerates (slow at the end) — things land, they don't slam                                                                                     
  - Swipe transitions that feel physical — content tracks your finger, doesn't just appear after you lift
  - Content changes (a progress bar moving, a card updating) that animate inline rather than full-screen replacing                                               
                                                                                                                                                                 
  What to reject:                                                                                                                                                
  - Bouncy/springy overdone animations (one bounce = charming, three bounces = toy)                                                                              
  - Motion that blocks you from tapping during the animation                                                                                                     
  - Page-flip / 3D card rotation anything                   
                                                                                                                                                                 
  Where to find it: Dribbble shots (search "mobile transition" or "app swipe"), or screen recordings on Mobbin's "Animations" filter. Reference candidates: Arc's
   tab swipe, Apple Weather's hourly scroll feel, Things 3's task completion animation, Linear mobile's row swipe.                                               
                                                                                                                                                                 
  Skip this if you're tight on time — you can tune motion with Reanimated defaults during build and get 80% there.                                               
                                                         
  ---                                                                                                                                                            
  5. Hero affordance — one big control the user wants to press
                                                              
  What it is: a screenshot of a mobile app where a single primary control dominates the screen and feels inviting. This is reference for the voice-capture button
   — the single highest-stakes component in your UI.                                                                                                             
  
  What to look for:                                                                                                                                              
  - The control is large (easily >60pt) but not aggressive
  - It has a single clear shape (circle usually wins here)                                                                                                       
  - It invites touch — not through animation, through placement and proportion
  - It's in the thumb zone (lower half of screen, centered or slightly trailing)                                                                                 
  - The rest of the screen recedes so the control is the obvious next step                                                                                       
  - Optional: a state variant showing what it looks like active/listening                                                                                        
                                                                                                                                                                 
  What to reject:                                                                                                                                                
  - Floating action buttons with the "+" / gradient / shadow treatment (that's the pattern we're explicitly rejecting)                                           
  - Tiny icon buttons in a toolbar                                                                                                                               
  - Anything that requires two taps to activate          
                                                                                                                                                                 
  Where to find it: voice-note apps, meditation apps, camera apps. Reference candidates: Voice Memos (iOS — the record button is exactly this pattern),
  Otter.ai's record affordance, Oak's breath-session start button, Calm's "start session" button, Ladder's big workout-start button. Hardware-inspired references
   work too — think old iPod click wheel, old tape recorder record button.
                                                                                                                                                                 
  Skip this if you're tight on time — the Claude Design brief already specifies three states (idle/listening/processing); a good reference accelerates the       
  aesthetic but isn't required.
