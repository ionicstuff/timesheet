const { User, RoleMaster, UserHierarchy, Client, Project } = require('./models');
const { Op } = require('sequelize');
const sequelize = require('./config/database');

async function testProfileAPI() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Test if we can find a user
    console.log('\nTesting user queries...');
    const userCount = await User.count();
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    // Find the first active user
    const testUser = await User.findOne({ 
      where: { isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    if (!testUser) {
      console.log('❌ No active users found in database.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})`);

    // Test the profile query similar to getUserProfile function
    console.log('\nTesting profile query with associations...');
    
    const user = await User.findByPk(testUser.id, {
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'description', 'level'],
          required: false
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsUser',
          where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          include: [
            {
              model: User,
              as: 'parentUser',
              attributes: ['id', 'firstName', 'lastName', 'email', 'designation', 'department']
            }
          ],
          attributes: ['hierarchyLevel', 'relationshipType', 'effectiveFrom', 'effectiveTo']
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsParent',
          where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'designation', 'department']
            }
          ],
          attributes: ['hierarchyLevel', 'relationshipType', 'effectiveFrom']
        },
        {
          model: Client,
          as: 'managedClients',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'clientName', 'email', 'status', 'industry']
        },
        {
          model: Project,
          as: 'managedProjects',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'projectName', 'status', 'startDate', 'endDate', 'description']
        }
      ],
      attributes: {
        exclude: ['passwordHash', 'resetPasswordToken', 'resetPasswordExpires']
      }
    });

    if (!user) {
      console.log('❌ Could not retrieve user with associations');
      return;
    }

    console.log('✅ Successfully retrieved user with associations');
    console.log(`   - Role: ${user.roleMaster ? user.roleMaster.roleName : 'No role assigned'}`);
    console.log(`   - Direct reports: ${user.hierarchyAsParent?.length || 0}`);
    console.log(`   - Managed clients: ${user.managedClients?.length || 0}`);
    console.log(`   - Managed projects: ${user.managedProjects?.length || 0}`);

    // Test the statistics queries
    console.log('\nTesting statistics queries...');

    const directReports = await UserHierarchy.count({
      where: {
        parentUserId: user.id,
        isActive: true,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: new Date() } }
        ]
      }
    });

    const managedClientsCount = await Client.count({
      where: {
        accountManagerId: user.id,
        isActive: true
      }
    });

    const managedProjectsCount = await Project.count({
      where: {
        projectManagerId: user.id,
        isActive: true
      }
    });

    console.log(`✅ Statistics calculated successfully:`);
    console.log(`   - Direct reports: ${directReports}`);
    console.log(`   - Managed clients: ${managedClientsCount}`);
    console.log(`   - Managed projects: ${managedProjectsCount}`);

    // Test getFullName method
    console.log('\nTesting getFullName method...');
    const fullName = user.getFullName();
    console.log(`✅ Full name: ${fullName}`);

    console.log('\n🎉 All tests passed! The profile API should work correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('\nDetailed error:', error.message);
    if (error.sql) {
      console.error('SQL Query:', error.sql);
    }
  } finally {
    await sequelize.close();
  }
}

// Run the test
testProfileAPI();
