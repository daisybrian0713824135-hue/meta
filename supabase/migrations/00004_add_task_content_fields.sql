
-- Add in-app task content columns
ALTER TABLE public.tasks
  ADD COLUMN content_type text NOT NULL DEFAULT 'text_instructions'
    CHECK (content_type IN ('video_embed','survey_form','annotation','countdown_claim','referral_share','feedback_form','text_instructions')),
  ADD COLUMN embed_url text DEFAULT NULL,
  ADD COLUMN task_questions jsonb DEFAULT NULL,
  ADD COLUMN watch_duration_seconds int DEFAULT NULL;

-- Update video tasks with embedded YouTube videos
UPDATE public.tasks SET
  content_type = 'video_embed',
  embed_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0',
  watch_duration_seconds = 90
WHERE title = 'Watch & Rate YouTube Video';

UPDATE public.tasks SET
  content_type = 'video_embed',
  embed_url = 'https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=0&rel=0',
  watch_duration_seconds = 60
WHERE title = 'Review Product Video';

UPDATE public.tasks SET
  content_type = 'video_embed',
  embed_url = 'https://www.youtube.com/embed/tgbNymZ7vqY?autoplay=0&rel=0',
  watch_duration_seconds = 30
WHERE title = 'Watch Product Ad';

UPDATE public.tasks SET
  content_type = 'video_embed',
  embed_url = 'https://www.youtube.com/embed/ZZ5LpwO-An4?autoplay=0&rel=0',
  watch_duration_seconds = 45
WHERE title = 'Mobile App Video Ad';

-- Update survey tasks with real in-app questions
UPDATE public.tasks SET
  content_type = 'survey_form',
  task_questions = '[
    {"id":"q1","question":"How satisfied are you with the products you buy online?","type":"radio","options":["Very Satisfied","Satisfied","Neutral","Dissatisfied","Very Dissatisfied"]},
    {"id":"q2","question":"How often do you shop online per month?","type":"radio","options":["1-2 times","3-5 times","6-10 times","More than 10 times"]},
    {"id":"q3","question":"What is the most important factor when buying online?","type":"radio","options":["Price","Quality","Delivery Speed","Reviews","Brand"]},
    {"id":"q4","question":"Any additional feedback about your online shopping experience?","type":"textarea","placeholder":"Share your thoughts..."}
  ]'::jsonb
WHERE title = 'Product Satisfaction Survey';

UPDATE public.tasks SET
  content_type = 'survey_form',
  task_questions = '[
    {"id":"q1","question":"How many hours per day do you use your smartphone?","type":"radio","options":["Less than 1 hour","1-3 hours","3-6 hours","More than 6 hours"]},
    {"id":"q2","question":"Which devices do you use daily?","type":"checkbox","options":["Smartphone","Laptop","Tablet","Desktop","Smartwatch"]},
    {"id":"q3","question":"What is your primary use of the internet?","type":"radio","options":["Social Media","Work/Study","Entertainment","Shopping","Communication"]},
    {"id":"q4","question":"Do you use mobile banking or mobile money?","type":"radio","options":["Yes, daily","Yes, occasionally","Rarely","Never"]},
    {"id":"q5","question":"Describe your biggest tech challenge in daily life:","type":"textarea","placeholder":"e.g. poor network, expensive data..."}
  ]'::jsonb
WHERE title = 'Tech Usage Survey';

-- Update annotation tasks with in-app sample data
UPDATE public.tasks SET
  content_type = 'annotation',
  task_questions = '[
    {"id":"i1","imageUrl":"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400","question":"What objects do you see in this image?","type":"checkbox","options":["Laptop","Coffee Cup","Keyboard","Phone","Notebook","Pen","Headphones"]},
    {"id":"i2","imageUrl":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400","question":"What is the dominant color in this image?","type":"radio","options":["Red","Blue","Green","Yellow","Gray","Brown","Black"]},
    {"id":"i3","imageUrl":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400","question":"What category best describes this image?","type":"radio","options":["Technology","Nature","People","Food","Transportation","Architecture","Animals"]}
  ]'::jsonb
WHERE title = 'Image Labeling Task';

UPDATE public.tasks SET
  content_type = 'annotation',
  task_questions = '[
    {"id":"r1","review":"This product arrived quickly and works perfectly! Very happy with my purchase.","question":"What is the sentiment of this review?","type":"radio","options":["Positive","Neutral","Negative"]},
    {"id":"r2","review":"The item looks nothing like the picture. Very disappointed with the quality.","question":"What is the sentiment of this review?","type":"radio","options":["Positive","Neutral","Negative"]},
    {"id":"r3","review":"Decent product for the price. Nothing special but does the job.","question":"What is the sentiment of this review?","type":"radio","options":["Positive","Neutral","Negative"]},
    {"id":"r4","review":"Outstanding quality! I have bought from this seller multiple times and always satisfied.","question":"What is the sentiment of this review?","type":"radio","options":["Positive","Neutral","Negative"]},
    {"id":"r5","review":"Took 3 weeks to arrive and packaging was damaged. Customer service was unhelpful.","question":"What is the sentiment of this review?","type":"radio","options":["Positive","Neutral","Negative"]}
  ]'::jsonb
WHERE title = 'Sentiment Analysis';

-- Update daily tasks
UPDATE public.tasks SET
  content_type = 'countdown_claim'
WHERE title = 'Daily Check-in';

UPDATE public.tasks SET
  content_type = 'referral_share'
WHERE title IN ('Daily Social Share', 'Refer a Friend');

-- Update app testing with feedback form
UPDATE public.tasks SET
  content_type = 'feedback_form',
  task_questions = '[
    {"id":"f1","question":"Rate the app overall (1-5 stars)","type":"radio","options":["⭐ 1 - Poor","⭐⭐ 2 - Below Average","⭐⭐⭐ 3 - Average","⭐⭐⭐⭐ 4 - Good","⭐⭐⭐⭐⭐ 5 - Excellent"]},
    {"id":"f2","question":"How easy was the app to navigate?","type":"radio","options":["Very Easy","Easy","Moderate","Difficult","Very Difficult"]},
    {"id":"f3","question":"Did you encounter any bugs or errors?","type":"radio","options":["No issues","Minor bugs","Major bugs","App crashed"]},
    {"id":"f4","question":"Describe the app and any improvements you suggest:","type":"textarea","placeholder":"Share your detailed feedback here..."}
  ]'::jsonb
WHERE title = 'Test New Mobile App';

UPDATE public.tasks SET
  content_type = 'feedback_form',
  task_questions = '[
    {"id":"f1","question":"How would you rate the overall website design?","type":"radio","options":["Excellent","Good","Average","Poor","Very Poor"]},
    {"id":"f2","question":"Was the website easy to navigate?","type":"radio","options":["Very Easy","Easy","Moderate","Difficult","Confusing"]},
    {"id":"f3","question":"Did you find all the information you were looking for?","type":"radio","options":["Yes, easily","Yes, with some effort","Partially","No"]},
    {"id":"f4","question":"What device did you use to test the website?","type":"radio","options":["Smartphone","Tablet","Laptop","Desktop"]},
    {"id":"f5","question":"List any UX issues, broken links, or suggestions:","type":"textarea","placeholder":"e.g. Navigation menu hard to find on mobile..."}
  ]'::jsonb
WHERE title = 'Website UX Testing';

-- Offers tasks
UPDATE public.tasks SET
  content_type = 'feedback_form',
  task_questions = '[
    {"id":"f1","question":"Have you successfully registered for the service?","type":"radio","options":["Yes, fully registered","Partially completed","No, had issues"]},
    {"id":"f2","question":"What email did you use to register?","type":"text","placeholder":"Enter the email you registered with"},
    {"id":"f3","question":"Rate the registration experience:","type":"radio","options":["Very Smooth","Smooth","Moderate","Difficult","Very Difficult"]},
    {"id":"f4","question":"Any additional comments about the service?","type":"textarea","placeholder":"Optional feedback..."}
  ]'::jsonb
WHERE title = 'Sign Up for Free Service';

UPDATE public.tasks SET
  content_type = 'feedback_form',
  task_questions = '[
    {"id":"f1","question":"Have you successfully downloaded the app?","type":"radio","options":["Yes, installed","Downloaded but not installed","Could not download"]},
    {"id":"f2","question":"Which platform did you download from?","type":"radio","options":["Google Play Store","Apple App Store","Direct APK","Other"]},
    {"id":"f3","question":"First impression of the app:","type":"radio","options":["Very Impressed","Good","Average","Disappointed"]},
    {"id":"f4","question":"Any comments about the app?","type":"textarea","placeholder":"Optional..."}
  ]'::jsonb
WHERE title = 'Download Free App';
