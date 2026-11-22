alter table public.settings
  add column if not exists specializations text[] not null
    default array['Cinematic Editing','Short-form Content','Color Grading','Motion Graphics','Sound Design'],
  add column if not exists software text[] not null
    default array['Adobe Premiere Pro','After Effects','DaVinci Resolve','Lightroom','CapCut'],
  add column if not exists services jsonb not null
    default '[
      {"title":"Video Editing","description":"Full long-form editing for YouTube, documentaries, and branded content with clean pacing and structure."},
      {"title":"Short-form Content","description":"Reels, TikTok, and Shorts engineered for retention — fast cuts, hooks, and captions that convert."},
      {"title":"Cinematic Editing","description":"Film-like storytelling with color grading, sound design, and editorial rhythm for premium visuals."},
      {"title":"Motion Graphics","description":"Animated titles, lower thirds, and visual effects that elevate brand storytelling."},
      {"title":"Social Media Video","description":"Platform-native edits optimized for each feed — from teaser drops to full campaigns."}
    ]'::jsonb;

alter table public.settings
  add constraint settings_services_is_array check (jsonb_typeof(services) = 'array');
