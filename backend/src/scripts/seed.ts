import { pool, query } from '../config/database';
import { hashPassword } from '../utils/password';

// Seed data from the Excel sheet
const coursesData = [
  {
    id: 1,
    title: 'AI & ML',
    slug: 'ai-ml',
    description: 'Advanced course on Artificial Intelligence and Machine Learning',
    level: 'Advanced',
    sections: [
      { id: 1, title: 'Introduction to AI', videos: 5, youtubeId: 'JMUxmLyrhSk' },
      { id: 2, title: 'Python for AI', videos: 8, youtubeId: '_uQrJ0TkZlc' },
      { id: 3, title: 'Machine Learning Basics', videos: 10, youtubeId: 'Gv9_4yMHFhI' },
      { id: 4, title: 'Deep Learning Fundamentals', videos: 7, youtubeId: 'aircAruvnKk' },
      { id: 5, title: 'Neural Networks', videos: 6, youtubeId: 'IHZwWFHWa-w' },
      { id: 6, title: 'Model Deployment', videos: 4, youtubeId: 'fwFfOe3uQ1Q' },
    ],
  },
  {
    id: 2,
    title: 'Java',
    slug: 'java',
    description: 'Intermediate course on Java programming',
    level: 'Intermediate',
    sections: [
      { id: 1, title: 'Java Basics', videos: 12, youtubeId: 'eIrMbAQSU34' },
      { id: 2, title: 'OOP Concepts', videos: 10, youtubeId: '6T_HgnjoYwM' },
      { id: 3, title: 'Collections Framework', videos: 8, youtubeId: 'GdAon80-0KA' },
      { id: 4, title: 'Exception Handling', videos: 5, youtubeId: '1XAfapkBQjk' },
      { id: 5, title: 'Multithreading', videos: 6, youtubeId: 'OJYmFT8c2bY' },
      { id: 6, title: 'Spring Boot Intro', videos: 7, youtubeId: 'vtPkZShrvXQ' },
    ],
  },
  {
    id: 3,
    title: 'Python',
    slug: 'python',
    description: 'Beginner course on Python programming',
    level: 'Beginner',
    sections: [
      { id: 1, title: 'Python Fundamentals', videos: 15, youtubeId: '_uQrJ0TkZlc' },
      { id: 2, title: 'Data Structures', videos: 9, youtubeId: 'R-HLU9Fl5ug' },
      { id: 3, title: 'Functions & Modules', videos: 6, youtubeId: 'HGOBQPFzWKo' },
      { id: 4, title: 'File Handling', videos: 4, youtubeId: 'Uh2ebFW8OYM' },
      { id: 5, title: 'OOP in Python', videos: 7, youtubeId: 'Ej_02ICOIgs' },
      { id: 6, title: 'Mini Project', videos: 5, youtubeId: '8ext9G7xspg' },
    ],
  },
  {
    id: 4,
    title: 'Data Science',
    slug: 'data-science',
    description: 'Advanced course on Data Science',
    level: 'Advanced',
    sections: [
      { id: 1, title: 'Intro to Data Science', videos: 6, youtubeId: 'ua-CiDNNj30' },
      { id: 2, title: 'Statistics & Probability', videos: 10, youtubeId: 'xxpc-HPKN28' },
      { id: 3, title: 'Data Cleaning', videos: 5, youtubeId: 'IYh4IYvJk2U' },
      { id: 4, title: 'EDA', videos: 6, youtubeId: '-o3AxdVcUtQ' },
      { id: 5, title: 'Machine Learning for DS', videos: 9, youtubeId: '7eh4d6sabA0' },
      { id: 6, title: 'Data Visualization', videos: 5, youtubeId: '0P7QnIQDBJY' },
    ],
  },
];

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Create test users
    console.log('Creating test users...');
    const testPassword = await hashPassword('password123');
    
    const testUsers = [
      { email: 'test@example.com', name: 'Test User' },
      { email: 'student@example.com', name: 'Student User' },
    ];

    for (const user of testUsers) {
      try {
        await query(
          'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
          [user.email, testPassword, user.name]
        );
        console.log(`  ✓ Created user: ${user.email}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⏭ Skipped user (exists): ${user.email}`);
        } else {
          throw error;
        }
      }
    }

    // Create subjects, sections, and videos
    console.log('\nCreating courses...');
    
    for (const course of coursesData) {
      // Create subject
      let subjectId: number;
      try {
        const result = await query<{ insertId: number }>(
          'INSERT INTO subjects (id, title, slug, description, is_published) VALUES (?, ?, ?, ?, ?)',
          [course.id, course.title, course.slug, course.description, true]
        );
        subjectId = result.insertId;
        console.log(`  ✓ Created subject: ${course.title}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          // Get existing subject ID
          const rows = await query<{ id: number }[]>(
            'SELECT id FROM subjects WHERE slug = ?',
            [course.slug]
          );
          subjectId = rows[0].id;
          console.log(`  ⏭ Skipped subject (exists): ${course.title}`);
        } else {
          throw error;
        }
      }

      // Create sections
      for (const section of course.sections) {
        let sectionId: number;
        try {
          const result = await query<{ insertId: number }>(
            'INSERT INTO sections (subject_id, title, order_index) VALUES (?, ?, ?)',
            [subjectId, section.title, section.id]
          );
          sectionId = result.insertId;
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            const rows = await query<{ id: number }[]>(
              'SELECT id FROM sections WHERE subject_id = ? AND order_index = ?',
              [subjectId, section.id]
            );
            sectionId = rows[0].id;
          } else {
            throw error;
          }
        }

        // Create videos for this section
        for (let i = 1; i <= section.videos; i++) {
          const videoTitle = `${section.title} - Video ${i}`;
          const youtubeUrl = `https://www.youtube.com/watch?v=${section.youtubeId}`;
          
          try {
            await query(
              'INSERT INTO videos (section_id, title, youtube_url, order_index) VALUES (?, ?, ?, ?)',
              [sectionId, videoTitle, youtubeUrl, i]
            );
          } catch (error: any) {
            if (error.code !== 'ER_DUP_ENTRY') {
              throw error;
            }
          }
        }
      }
      
      console.log(`    ✓ Created ${course.sections.length} sections with videos`);
    }

    // Enroll test users in all subjects
    console.log('\nEnrolling test users...');
    const subjects = await query<{ id: number }[]>('SELECT id FROM subjects');
    const users = await query<{ id: number }[]>('SELECT id FROM users');

    for (const user of users) {
      for (const subject of subjects) {
        try {
          await query(
            'INSERT INTO enrollments (user_id, subject_id) VALUES (?, ?)',
            [user.id, subject.id]
          );
        } catch (error: any) {
          if (error.code !== 'ER_DUP_ENTRY') {
            throw error;
          }
        }
      }
    }
    console.log(`  ✓ Enrolled ${users.length} users in ${subjects.length} subjects`);

    console.log('\n✅ Database seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Database seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedDatabase();
