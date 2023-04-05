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
      },
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  async writing() {
    // Creating the application + adding required nuget packages
    this._writeSolutionFiles();

    // Add Authentication
    this._addAuth();
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

    // // Copy the base templates to the project
    // this.fs.copyTpl(
    //   this.templatePath('templates/src/'),
    //   this.destinationPath('src/'),
    //   { projectName: this.appName }
    // );

    // this.fs.copy(
    //   this.templatePath('templates/.gitignore'),
    //   this.destinationPath('.gitignore')
    // );
    // this.fs.copy(
    //   this.templatePath('templates/appsettings.json'),
    //   this.destinationPath('appsettings.json')
    // );
    // this.fs.copy(
    //   this.templatePath('templates/appsettings.Development.json'),
    //   this.destinationPath('appsettings.Development.json')
    // );
    // this.fs.copy(
    //   this.templatePath('templates/Program.cs'),
    //   this.destinationPath('Program.cs')
    // );
    // this.fs.copy(
    //   this.templatePath('templates/README.md'),
    //   this.destinationPath('README.md')
    // );
    // this.fs.copy(
    //   this.templatePath('templates/Startup.cs'),
    //   this.destinationPath('Startup.cs')
    // );
  }

  //function that updates the Startup.cs file with the appropriate database configuration based on the user's choice:
  _updateStartupWithDatabaseConfiguration() {
    const startupFilePath = this.destinationPath('Startup.cs');
  
    const databaseConfigSnippet = {
      sqlserver: `services.AddDbContext<YourDbContext>(options =>
      options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection")));`,
      postgresql: `services.AddDbContext<YourDbContext>(options =>
      options.UseNpgsql(Configuration.GetConnectionString("DefaultConnection")));`,
      mysql: `services.AddDbContext<YourDbContext>(options =>
      options.UseMySql(Configuration.GetConnectionString("DefaultConnection"),
      ServerVersion.AutoDetect(Configuration.GetConnectionString("DefaultConnection"))));`,
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



  install() {
    this.installDependencies();
  }
};
