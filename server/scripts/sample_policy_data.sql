-- Sample Policy Data for Testing
-- This script inserts sample policies and comments for testing the frontend

-- Insert sample policies
INSERT INTO policies (name, description, view_full_policy, ministry, status, effective_date) VALUES 
(
  'Digital Sri Lanka Strategy 2030',
  'Comprehensive digitalization plan for government services and e-governance to transform Sri Lanka into a digital economy',
  'This comprehensive policy outlines the roadmap for transforming Sri Lanka into a digital nation by 2030. The strategy encompasses digital infrastructure development, e-governance initiatives, digital literacy programs, cybersecurity frameworks, and innovation hubs. Key objectives include: 1) Establishing high-speed internet connectivity across all districts, 2) Digitizing 90% of government services, 3) Implementing blockchain-based identity systems, 4) Creating 100,000 new digital jobs, 5) Establishing 50 innovation centers nationwide.',
  'Ministry of Technology',
  'PUBLIC_CONSULTATION',
  '2024-06-01'
),
(
  'Sustainable Agriculture Development Act',
  'Support for organic farming and climate-resilient agriculture practices to ensure food security',
  'This policy promotes sustainable agricultural practices through organic farming incentives, climate-resilient crop varieties, water conservation techniques, and farmer education programs. The act includes provisions for: 1) 50% subsidies for organic fertilizers, 2) Training programs for 500,000 farmers, 3) Establishment of 200 seed banks, 4) Implementation of precision agriculture technologies, 5) Creation of farmer insurance schemes against climate risks.',
  'Ministry of Agriculture',
  'UNDER_REVIEW',
  '2024-07-15'
),
(
  'Public Transport Modernization Plan',
  'Investment in electric buses and railway system improvements for sustainable urban mobility',
  'This modernization plan focuses on developing eco-friendly public transportation systems across Sri Lanka. The plan includes: 1) Introduction of 1,000 electric buses in major cities, 2) Upgrading railway infrastructure with modern signaling systems, 3) Integration of digital payment systems, 4) Construction of 50 new bus rapid transit stations, 5) Implementation of real-time tracking and mobile applications for commuters.',
  'Ministry of Transport',
  'DRAFT',
  '2024-09-01'
),
(
  'National Healthcare Digitization Initiative',
  'Implementation of electronic health records and telemedicine services nationwide',
  'This initiative aims to digitize healthcare services across Sri Lanka through electronic health records, telemedicine platforms, and AI-powered diagnostic tools. Key components include: 1) Digital health records for all citizens, 2) Telemedicine services in rural areas, 3) AI-assisted diagnostic systems in 100 hospitals, 4) Mobile health applications for preventive care, 5) Integration with international health standards.',
  'Ministry of Health',
  'ACTIVE',
  '2024-01-01'
),
(
  'Renewable Energy Transition Policy',
  'Accelerating the shift to renewable energy sources for sustainable development',
  'This policy outlines Sri Lanka''s commitment to achieving 80% renewable energy by 2030. The transition plan includes: 1) Installation of 2,000 MW solar capacity, 2) Development of 500 MW wind power projects, 3) Hydroelectric efficiency improvements, 4) Grid modernization with smart technologies, 5) Community-based renewable energy programs.',
  'Ministry of Power and Energy',
  'APPROVED',
  '2024-03-01'
);

-- Insert sample users (for comments)
INSERT INTO users (user_name, email, nic, mobile_no, Province) VALUES 
('Nuwan Perera', 'nuwan.perera@email.com', '900123456V', '0771234567', 'Western'),
('Kamala Silva', 'kamala.silva@email.com', '850987654V', '0712345678', 'Central'),
('Ranil Fernando', 'ranil.fernando@email.com', '750456789V', '0723456789', 'Southern'),
('Sita Jayawardena', 'sita.jay@email.com', '920678912V', '0734567890', 'Northern'),
('Pradeep Wickramasinghe', 'pradeep.w@email.com', '880234567V', '0745678901', 'Eastern')
ON CONFLICT (email) DO NOTHING;

-- Insert sample policy comments
INSERT INTO policy_comments (comment, user_id, policy_id, likes) VALUES 
(
  'This digital transformation initiative is exactly what Sri Lanka needs! The focus on digital literacy and innovation hubs will create opportunities for our youth.',
  1,
  1,
  23
),
(
  'While I support digitalization, we must ensure that rural communities are not left behind. Internet connectivity in remote areas needs to be prioritized.',
  2,
  1,
  18
),
(
  'The organic farming incentives are a great step forward. As a farmer, I believe this will help us reduce dependency on chemical fertilizers and improve soil health.',
  3,
  2,
  31
),
(
  'Electric buses are the future! This will significantly reduce air pollution in Colombo. When can we expect to see the first fleet on the roads?',
  4,
  3,
  27
),
(
  'The healthcare digitization initiative has already improved service delivery in our local hospital. The electronic records system saves so much time.',
  5,
  4,
  45
),
(
  'Renewable energy is crucial for our environmental goals. The 80% target by 2030 is ambitious but achievable with proper implementation.',
  1,
  5,
  39
),
(
  'I have concerns about the timeline for the transport modernization. Two years seems too optimistic for such a large-scale project.',
  2,
  3,
  12
),
(
  'The farmer training programs should include modules on climate change adaptation. This is essential for long-term sustainability.',
  3,
  2,
  22
),
(
  'Digital governance will improve transparency and reduce corruption. This policy has my full support!',
  4,
  1,
  33
),
(
  'Solar power installations should prioritize households and small businesses. Community ownership models would be ideal.',
  5,
  5,
  28
);

-- Insert some reply comments
INSERT INTO policy_comments (comment, user_id, policy_id, reply_id, reply_comment, likes) VALUES 
(
  'You raise a valid point about rural connectivity. The policy should include specific targets for rural internet penetration.',
  3,
  1,
  2,
  'Internet connectivity in remote areas needs to be prioritized.',
  15
),
(
  'The first phase of electric buses is scheduled to start in Colombo by mid-2024, followed by other major cities.',
  1,
  3,
  4,
  'When can we expect to see the first fleet on the roads?',
  19
),
(
  'Climate change adaptation is actually covered in module 3 of the training program. You can find details in the full policy document.',
  2,
  2,
  8,
  'The farmer training programs should include modules on climate change adaptation.',
  11
);
