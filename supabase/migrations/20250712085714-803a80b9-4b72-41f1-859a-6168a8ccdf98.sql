-- Add foreign key relationships between questions/answers and profiles
ALTER TABLE public.questions 
ADD CONSTRAINT fk_questions_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.answers 
ADD CONSTRAINT fk_answers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Insert demo users with profiles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES
('11111111-1111-1111-1111-111111111111', 'john@example.com', '$2a$10$dummy.hash.for.demo.user', now(), now(), now(), '{"username": "john_dev", "display_name": "John Developer"}'),
('22222222-2222-2222-2222-222222222222', 'sarah@example.com', '$2a$10$dummy.hash.for.demo.user', now(), now(), now(), '{"username": "sarah_coder", "display_name": "Sarah Coder"}'),
('33333333-3333-3333-3333-333333333333', 'mike@example.com', '$2a$10$dummy.hash.for.demo.user', now(), now(), now(), '{"username": "mike_js", "display_name": "Mike JavaScript"}')
ON CONFLICT (id) DO NOTHING;

-- Insert demo profiles
INSERT INTO public.profiles (user_id, username, display_name, bio, reputation) VALUES
('11111111-1111-1111-1111-111111111111', 'john_dev', 'John Developer', 'Full-stack developer with 5 years experience', 150),
('22222222-2222-2222-2222-222222222222', 'sarah_coder', 'Sarah Coder', 'Frontend specialist, loves React and CSS', 120),
('33333333-3333-3333-3333-333333333333', 'mike_js', 'Mike JavaScript', 'JavaScript enthusiast, Node.js expert', 200)
ON CONFLICT (user_id) DO NOTHING;

-- Insert demo questions
INSERT INTO public.questions (id, title, content, user_id, vote_count, view_count, answer_count) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'How to center a div in CSS?', '<p>I''ve been struggling with centering a div element both horizontally and vertically. What are the best modern approaches?</p>', '11111111-1111-1111-1111-111111111111', 5, 42, 2),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'React useEffect cleanup function', '<p>When should I use cleanup functions in useEffect? Can someone explain with examples?</p>', '22222222-2222-2222-2222-222222222222', 8, 67, 1),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Best practices for Node.js error handling', '<p>What are the recommended patterns for handling errors in Node.js applications? Looking for both async/await and promise-based approaches.</p>', '33333333-3333-3333-3333-333333333333', 12, 89, 3)
ON CONFLICT (id) DO NOTHING;

-- Link questions with tags
INSERT INTO public.question_tags (question_id, tag_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22dac167-8249-4adc-9b96-69a534c562af'), -- CSS
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cff6f1a4-6ab3-4e0a-8c03-362dc2573e20'), -- React  
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c0699657-c180-44b0-910c-ae39d1a7429f') -- JavaScript
ON CONFLICT (question_id, tag_id) DO NOTHING;

-- Insert demo answers
INSERT INTO public.answers (id, content, question_id, user_id, vote_count, is_accepted) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '<p>You can use Flexbox for modern centering:</p><pre><code>.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}</code></pre>', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 3, true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '<p>CSS Grid is another great option:</p><pre><code>.container {
  display: grid;
  place-items: center;
  height: 100vh;
}</code></pre>', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 2, false),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '<p>Cleanup functions prevent memory leaks:</p><pre><code>useEffect(() => {
  const timer = setInterval(() => {
    console.log("Timer tick");
  }, 1000);
  
  return () => clearInterval(timer);
}, []);</code></pre>', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 6, true)
ON CONFLICT (id) DO NOTHING;

-- Update question accepted answers
UPDATE public.questions SET accepted_answer_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.questions SET accepted_answer_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';