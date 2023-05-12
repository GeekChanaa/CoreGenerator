'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the ultimate ${chalk.red('generator-csharp-api-generator')} generator!`
      )
    );

    const prompts = [
      {
        type: 'input',
        name: 'appName',
        message: 'What is the name of your project?',
        default: this.appname.replace(/\s+/g, '-'),
      },
      {
        type: 'list',
        name: 'databaseProvider',
        message: 'Which database provider do you want to use?',
        choices: [
          { name: 'SQL Server', value: 'sqlserver' },
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'MySQL', value: 'mysql' },
        ],
        default: 'sqlserver',
      },
      {
        type: 'confirm',
        name: 'includeOAuth',
        message: 'Do you want to include OAuth 2.0 support?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeMailingService',
        message: 'Do you want to include a mailing service?',
        default: false,
      },{
        type: 'input',
        name: 'server',
        message: 'Enter the server name:',
      },
      {
        type: 'input',
        name: 'database',
        message: 'Enter the database name:',
      },
      {
        type: 'input',
        name: 'user',
        message: 'Enter the username:',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter the password:',
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  async writing() {
    // Creating the application + adding required nuget packages
    this._writeSolutionFiles();
    const appSettingsPath = this.destinationPath('appsettings.json');
    let appSettings = this.fs.readJSON(appSettingsPath);

    if (!appSettings) {
      appSettings = {};
    }
    if (!appSettings.ConnectionStrings) {
      appSettings.ConnectionStrings = {};
    }

    appSettings.ConnectionStrings.DefaultConnection = 
      `Server=${this.props.server};Database=${this.props.database};User Id=${this.props.user};Password=${this.props.password};`;

    this.fs.writeJSON(appSettingsPath, appSettings);
    // Add repository and database context
    this._addDbRepository();

    // Add Authentication
    this._addAuth();

    // Add generic Controller
    this._addGenericController();

    // Read the JSON file
    const modelsData = this.fs.read(this.templatePath('models.json'), 'utf8');
    const models = JSON.parse(modelsData);

    // Loop over the models and generate a model and controller for each one
    for (const model of models) {
      this._generateModel(model);
      this._generateController(model);
    }

    
  }

  _generateModel(model) {
    const destinationPath = this.destinationPath(`Models/${model.name}.cs`);

    this.fs.copyTpl(
      this.templatePath('Models/Model.cs'),
      destinationPath,
      { 
        projectName: this.props.appName,
        modelName : model.name,
        fields : model.fields
      }
    );
  }

  _generateController(model) {
    const destinationPath = this.destinationPath(`Controllers/${model.name}Controller.cs`);

    this.fs.copyTpl(
      this.templatePath('Controllers/Controller.cs'),
      destinationPath,
      { 
        projectName: this.props.appName,
        modelName : model.name,
        fields : model.fields
      }
    );
  }

  _writeSolutionFiles() {
    // Your code here for generating .NET Core solution files
    // Create a new Web API project
    console.log("this is the file");
    console.log(this.props.appName);
    this.spawnCommandSync('dotnet', ['new', 'webapi', '-n', this.props.appName]);

    // Change the destination root to the new project folder
    this.destinationRoot(this.destinationPath(this.props.appName));

    // Add required NuGet packages
    this.spawnCommandSync('dotnet', ['add', 'package', 'Microsoft.EntityFrameworkCore']);
    this.spawnCommandSync('dotnet', ['add', 'package', 'Microsoft.EntityFrameworkCore.Design']);

    //Copy the base templates to the project
    this.fs.copyTpl(
      this.templatePath('Program.cs'),
      this.destinationPath('Program.cs'),
      { projectName: this.props.appName }
    );
  }

  //function that updates the Startup.cs file with the appropriate database configuration based on the user's choice:
  _updateStartupWithDatabaseConfiguration() {
    const startupFilePath = this.destinationPath('Startup.cs');
  
    const databaseConfigSnippet = {
      sqlserver: `builder.Services.AddDbContext<${this.props.appName}>(options =>
      options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));`,
      postgresql: `builder.Services.AddDbContext<${this.props.appName}>(options =>
      options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));`,
      mysql: `builder.Services.AddDbContext<${this.props.appName}>(options =>
      options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"),
      ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));`,
    };
    

  
    const startupContent = this.fs.read(startupFilePath);
    const newStartupContent = startupContent.replace(
      '// Add your DbContext configuration here',
      databaseConfigSnippet[this.options.databaseProvider]
    );

    
  
    this.fs.write(startupFilePath, newStartupContent);
  }


  _addDbRepository(){
    // Adding Repository
    this.fs.copyTpl(
      this.templatePath('Data/IRepository.cs'),
      this.destinationPath('Data/IRepository.cs'),
      { projectName: this.props.appName }
    );
    this.fs.copyTpl(
      this.templatePath('Data/Repository.cs'),
      this.destinationPath('Data/Repository.cs'),
      { projectName: this.props.appName }
    );
    this.fs.copyTpl(
      this.templatePath('Data/DbContext.cs'),
      this.destinationPath('Data/DbContext.cs'),
      { projectName: this.props.appName }
    );

    this.spawnCommandSync('dotnet', ['add', 'package', 'Microsoft.EntityFrameworkCore.SqlServer']);

    // Registring the repository
    const programContentPath = this.destinationPath('Program.cs');
    const programContent = this.fs.read(programContentPath);
    var programContentNew = programContent.replace(
      '// Add your Repository registration here ',
      'builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));'
    );

    programContentNew = programContentNew.replace(
      '// Add your DbContext configuration here',
      `builder.Services.AddDbContext<${this.props.appName}DbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));`
    )
    this.fs.write(programContentPath, programContentNew);
  }


  _addAuth(){
    // Copy AuthRepository and IAuthRepository
    this.fs.copyTpl(
      this.templatePath('Data/Authrepository.cs'),
      this.destinationPath('Data/AuthRepository.cs'),
      { projectName: this.props.appName }
    );
    this.fs.copyTpl(
      this.templatePath('Data/IAuthrepository.cs'),
      this.destinationPath('Data/IAuthRepository.cs'),
      { projectName: this.props.appName }
    );

    // Copying required models for authentication
    this.fs.copyTpl(
      this.templatePath('Models/User.cs'),
      this.destinationPath('Models/User.cs'),
      { projectName: this.props.appName }
    );

    const dbContextPath = this.destinationPath('Data/DbContext.cs');
    const dbContextContent = this.fs.read(dbContextPath);

    let newDbContextContent = dbContextContent;

    // Assuming your models are in a file named 'models.json' in the same directory
    let models = this.fs.readJSON(this.templatePath('models.json'));

    // Adding the user dbset in the db context
    newDbContextContent = newDbContextContent.replace(
      '// Add any Dbset configurations here',
      'public DbSet<User> Users { get; set; }\n' + '// Add any Dbset configurations here',
    );
    for (let model of models) {
      let modelName = model.name;  // Assuming each model has a 'name' field
      let dbSetLine = `public DbSet<${modelName}> ${modelName}s { get; set; }\n`;
      
      newDbContextContent = newDbContextContent.replace(
        '// Add any Dbset configurations here',
        dbSetLine + '// Add any Dbset configurations here'
      );
    }

    this.fs.write(dbContextPath, newDbContextContent);
    this.fs.copyTpl(
      this.templatePath('Helpers/RandomString.cs'),
      this.destinationPath('Helpers/RandomString.cs'),
      { projectName: this.props.appName }
    );

    

    // Copying Dtos for authentication
    this.fs.copyTpl(
      this.templatePath('Dtos/UserForLoginDto.cs'),
      this.destinationPath('Dtos/UserForLoginDto.cs'),
      { projectName: this.props.appName }
    );
    this.fs.copyTpl(
      this.templatePath('Dtos/UserForRegisterDto.cs'),
      this.destinationPath('Dtos/UserForRegisterDto.cs'),
      { projectName: this.props.appName }
    );
    this.fs.copyTpl(
      this.templatePath('Dtos/UserForUpdateDto.cs'),
      this.destinationPath('Dtos/UserForUpdateDto.cs'),
      { projectName: this.props.appName }
    );
    this.fs.copyTpl(
      this.templatePath('Dtos/UserPasswordChangeDto.cs'),
      this.destinationPath('Dtos/UserPasswordChangeDto.cs'),
      { projectName: this.props.appName }
    );

  }

  _addOAuth() {
    if (!this.options.includeOAuth) {
      return;
    }
  
    const startupFilePath = this.destinationPath('Startup.cs');
  
    // Add required NuGet packages
    this.spawnCommandSync('dotnet', ['add', 'package', 'Microsoft.AspNetCore.Authentication.Google']);
  
    // Google OAuth configuration in Startup.cs
    const googleOAuthSnippet = `
      services.AddAuthentication(options =>
      {
          options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
          options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
          options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
      })
      .AddCookie()
      .AddGoogle(options =>
      {
          options.ClientId = Configuration["Authentication:Google:ClientId"];
          options.ClientSecret = Configuration["Authentication:Google:ClientSecret"];
      });`;
  
    // Update ConfigureServices method in Startup.cs
    const startupContent = this.fs.read(startupFilePath);
    const newStartupContent = startupContent.replace(
      '// Add your OAuth2 configuration here',
      googleOAuthSnippet
    );
    this.fs.write(startupFilePath, newStartupContent);
  
    // Add Google OAuth secrets to appsettings.json
    const appSettingsPath = this.destinationPath('appsettings.json');
    const appSettingsContent = this.fs.readJSON(appSettingsPath);
    appSettingsContent.Authentication = {
      Google: {
        ClientId: "YOUR_GOOGLE_CLIENT_ID",
        ClientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      },
    };
    this.fs.writeJSON(appSettingsPath, appSettingsContent);
  }

  _addGenericController()
  {
    // Copying Generic Controller for authentication
    this.fs.copyTpl(
      this.templatePath('Controllers/GenericController.cs'),
      this.destinationPath('Controllers/GenericController.cs'),
      { projectName: this.props.appName }
    );
  }



  install() {
    this.installDependencies();
  }
};
