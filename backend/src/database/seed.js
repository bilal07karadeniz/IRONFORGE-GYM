require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, transaction } = require('../config/database');
const config = require('../config');

const seedData = async () => {
  console.log('Starting database seeding...');

  try {
    await transaction(async (client) => {
      // Clear existing data (in reverse order of dependencies)
      console.log('Clearing existing data...');
      await client.query('DELETE FROM waiting_list');
      await client.query('DELETE FROM bookings');
      await client.query('DELETE FROM schedules');
      await client.query('DELETE FROM classes');
      await client.query('DELETE FROM trainers');
      await client.query('DELETE FROM users');

      // Create admin user
      console.log('Creating users...');
      const adminPassword = await bcrypt.hash('Admin123!', config.bcrypt.saltRounds);
      const adminResult = await client.query(
        `INSERT INTO users (email, password, full_name, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['admin@gymfit.com', adminPassword, 'System Administrator', '+1-555-0100', 'admin']
      );
      const adminId = adminResult.rows[0].id;

      // Create trainer users
      const trainerPassword = await bcrypt.hash('Trainer123!', config.bcrypt.saltRounds);
      const trainersData = [
        { email: 'sarah.johnson@gymfit.com', name: 'Sarah Johnson', phone: '+1-555-0101', specialization: 'Yoga & Pilates', bio: 'Certified yoga instructor with 8 years of experience. Specializes in Vinyasa and Hatha yoga.', years: 8 },
        { email: 'mike.chen@gymfit.com', name: 'Mike Chen', phone: '+1-555-0102', specialization: 'Strength Training', bio: 'Former competitive powerlifter. NSCA certified strength and conditioning specialist.', years: 10 },
        { email: 'emma.rodriguez@gymfit.com', name: 'Emma Rodriguez', phone: '+1-555-0103', specialization: 'Cardio & HIIT', bio: 'High-energy trainer specializing in cardio kickboxing and HIIT workouts.', years: 5 },
        { email: 'david.wilson@gymfit.com', name: 'David Wilson', phone: '+1-555-0104', specialization: 'CrossFit', bio: 'CrossFit Level 2 trainer. Competed in regional CrossFit games.', years: 6 },
        { email: 'lisa.park@gymfit.com', name: 'Lisa Park', phone: '+1-555-0105', specialization: 'Swimming', bio: 'Former NCAA swimmer. Certified lifeguard and swim instructor.', years: 12 },
      ];

      const trainerIds = [];
      for (const trainer of trainersData) {
        const userResult = await client.query(
          `INSERT INTO users (email, password, full_name, phone, role)
           VALUES ($1, $2, $3, $4, 'trainer')
           RETURNING id`,
          [trainer.email, trainerPassword, trainer.name, trainer.phone]
        );

        const trainerResult = await client.query(
          `INSERT INTO trainers (user_id, specialization, bio, years_experience, rating, rating_count, hourly_rate)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [userResult.rows[0].id, trainer.specialization, trainer.bio, trainer.years, 4.5 + Math.random() * 0.5, Math.floor(Math.random() * 50) + 10, 50 + Math.random() * 30]
        );

        trainerIds.push(trainerResult.rows[0].id);
      }

      // Create member users
      const memberPassword = await bcrypt.hash('Member123!', config.bcrypt.saltRounds);
      const membersData = [
        { email: 'john.doe@email.com', name: 'John Doe', phone: '+1-555-0201' },
        { email: 'jane.smith@email.com', name: 'Jane Smith', phone: '+1-555-0202' },
        { email: 'bob.brown@email.com', name: 'Bob Brown', phone: '+1-555-0203' },
        { email: 'alice.williams@email.com', name: 'Alice Williams', phone: '+1-555-0204' },
        { email: 'charlie.davis@email.com', name: 'Charlie Davis', phone: '+1-555-0205' },
        { email: 'diana.miller@email.com', name: 'Diana Miller', phone: '+1-555-0206' },
        { email: 'edward.garcia@email.com', name: 'Edward Garcia', phone: '+1-555-0207' },
        { email: 'fiona.martinez@email.com', name: 'Fiona Martinez', phone: '+1-555-0208' },
      ];

      const memberIds = [];
      for (const member of membersData) {
        const result = await client.query(
          `INSERT INTO users (email, password, full_name, phone, role)
           VALUES ($1, $2, $3, $4, 'member')
           RETURNING id`,
          [member.email, memberPassword, member.name, member.phone]
        );
        memberIds.push(result.rows[0].id);
      }

      // Create classes
      console.log('Creating classes...');
      const classesData = [
        { name: 'Morning Flow Yoga', description: 'Start your day with gentle stretching and mindful breathing. Perfect for all levels.', duration: 60, capacity: 20, trainer: 0, category: 'yoga', difficulty: 'beginner', equipment: ['yoga mat', 'yoga blocks'] },
        { name: 'Power Vinyasa', description: 'Dynamic yoga flow that builds strength and flexibility. Intermediate to advanced.', duration: 75, capacity: 15, trainer: 0, category: 'yoga', difficulty: 'advanced', equipment: ['yoga mat'] },
        { name: 'Strength Fundamentals', description: 'Learn proper lifting techniques and build a solid strength foundation.', duration: 60, capacity: 12, trainer: 1, category: 'strength', difficulty: 'beginner', equipment: ['dumbbells', 'barbell', 'weight plates'] },
        { name: 'Advanced Powerlifting', description: 'Focus on squat, bench press, and deadlift for experienced lifters.', duration: 90, capacity: 8, trainer: 1, category: 'strength', difficulty: 'advanced', equipment: ['power rack', 'barbell', 'weight plates', 'lifting belt'] },
        { name: 'Cardio Kickboxing', description: 'High-energy workout combining martial arts and cardio movements.', duration: 45, capacity: 25, trainer: 2, category: 'cardio', difficulty: 'intermediate', equipment: ['boxing gloves', 'punching bag'] },
        { name: 'HIIT Blast', description: '30-minute high-intensity interval training for maximum calorie burn.', duration: 30, capacity: 20, trainer: 2, category: 'cardio', difficulty: 'intermediate', equipment: ['kettlebell', 'jump rope'] },
        { name: 'CrossFit WOD', description: 'Workout of the Day featuring varied functional movements at high intensity.', duration: 60, capacity: 16, trainer: 3, category: 'crossfit', difficulty: 'intermediate', equipment: ['barbell', 'pull-up bar', 'rowing machine', 'kettlebell'] },
        { name: 'CrossFit Foundations', description: 'Introduction to CrossFit movements and methodology.', duration: 60, capacity: 12, trainer: 3, category: 'crossfit', difficulty: 'beginner', equipment: ['PVC pipe', 'medicine ball', 'kettlebell'] },
        { name: 'Lap Swimming', description: 'Guided lap swimming session with technique tips.', duration: 45, capacity: 10, trainer: 4, category: 'swimming', difficulty: 'intermediate', equipment: ['swim cap', 'goggles'] },
        { name: 'Aqua Aerobics', description: 'Low-impact water workout great for all fitness levels.', duration: 45, capacity: 15, trainer: 4, category: 'swimming', difficulty: 'beginner', equipment: ['pool noodle', 'water dumbbells'] },
        { name: 'Spin Class', description: 'Indoor cycling workout with music and motivation.', duration: 45, capacity: 30, trainer: 2, category: 'spinning', difficulty: 'intermediate', equipment: ['spin bike'] },
        { name: 'Pilates Core', description: 'Mat-based Pilates focusing on core strength and stability.', duration: 50, capacity: 18, trainer: 0, category: 'pilates', difficulty: 'beginner', equipment: ['pilates mat', 'resistance band'] },
      ];

      const classIds = [];
      for (const cls of classesData) {
        const result = await client.query(
          `INSERT INTO classes (name, description, duration_minutes, max_capacity, trainer_id, category, difficulty_level, equipment_needed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [cls.name, cls.description, cls.duration, cls.capacity, trainerIds[cls.trainer], cls.category, cls.difficulty, cls.equipment]
        );
        classIds.push(result.rows[0].id);
      }

      // Create schedules for the next 2 weeks
      console.log('Creating schedules...');
      const scheduleIds = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const timeSlots = [
        { hour: 6, minute: 0 },
        { hour: 7, minute: 30 },
        { hour: 9, minute: 0 },
        { hour: 10, minute: 30 },
        { hour: 12, minute: 0 },
        { hour: 17, minute: 0 },
        { hour: 18, minute: 30 },
        { hour: 20, minute: 0 },
      ];

      const rooms = ['Studio A', 'Studio B', 'Weight Room', 'Pool', 'Spin Studio'];

      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const scheduleDate = new Date(today);
        scheduleDate.setDate(scheduleDate.getDate() + dayOffset);

        // Skip creating too many schedules, just do 3-5 classes per day
        const numClasses = 3 + Math.floor(Math.random() * 3);
        const shuffledClasses = [...classesData].sort(() => Math.random() - 0.5).slice(0, numClasses);

        for (let i = 0; i < shuffledClasses.length; i++) {
          const cls = shuffledClasses[i];
          const classIndex = classesData.indexOf(cls);
          const slot = timeSlots[i % timeSlots.length];

          const startTime = new Date(scheduleDate);
          startTime.setHours(slot.hour, slot.minute, 0, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + cls.duration);

          const room = rooms[Math.floor(Math.random() * rooms.length)];

          const result = await client.query(
            `INSERT INTO schedules (class_id, trainer_id, start_time, end_time, room, current_bookings)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [classIds[classIndex], trainerIds[cls.trainer], startTime.toISOString(), endTime.toISOString(), room, 0]
          );

          scheduleIds.push({ id: result.rows[0].id, maxCapacity: cls.capacity });
        }
      }

      // Create some bookings
      console.log('Creating bookings...');
      for (const schedule of scheduleIds.slice(0, 20)) {
        // Each schedule gets 2-5 random bookings
        const numBookings = 2 + Math.floor(Math.random() * 4);
        const shuffledMembers = [...memberIds].sort(() => Math.random() - 0.5).slice(0, Math.min(numBookings, schedule.maxCapacity));

        for (const memberId of shuffledMembers) {
          await client.query(
            `INSERT INTO bookings (user_id, schedule_id, status)
             VALUES ($1, $2, 'confirmed')`,
            [memberId, schedule.id]
          );

          await client.query(
            'UPDATE schedules SET current_bookings = current_bookings + 1 WHERE id = $1',
            [schedule.id]
          );
        }
      }

      // Add some people to waiting lists for full classes
      console.log('Creating waiting list entries...');
      // Find schedules that are nearly full and add waiting list entries
      const nearlyFullSchedules = await client.query(
        `SELECT s.id, c.max_capacity - s.current_bookings as available
         FROM schedules s
         JOIN classes c ON s.class_id = c.id
         WHERE c.max_capacity - s.current_bookings <= 2 AND s.start_time > NOW()
         LIMIT 5`
      );

      let position = 1;
      for (const schedule of nearlyFullSchedules.rows) {
        // Add 1-3 people to waiting list
        const waitingCount = 1 + Math.floor(Math.random() * 3);
        const waitingMembers = [...memberIds].sort(() => Math.random() - 0.5).slice(0, waitingCount);

        for (let i = 0; i < waitingMembers.length; i++) {
          // Check if member doesn't already have a booking
          const existingBooking = await client.query(
            'SELECT id FROM bookings WHERE user_id = $1 AND schedule_id = $2',
            [waitingMembers[i], schedule.id]
          );

          if (existingBooking.rows.length === 0) {
            await client.query(
              `INSERT INTO waiting_list (user_id, schedule_id, position)
               VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING`,
              [waitingMembers[i], schedule.id, i + 1]
            );
          }
        }
      }

      console.log('Seeding completed successfully!');
      console.log('\n--- Login Credentials ---');
      console.log('Admin: admin@gymfit.com / Admin123!');
      console.log('Trainer: sarah.johnson@gymfit.com / Trainer123!');
      console.log('Member: john.doe@email.com / Member123!');
      console.log('------------------------\n');
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run seeding
seedData()
  .then(() => {
    console.log('Database seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exit(1);
  });
