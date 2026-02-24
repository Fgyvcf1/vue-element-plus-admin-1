; Inno Setup Script
#define MyAppName "Vue Element Plus Admin"
#define MyAppVersion "3.0.0"
#define MyAppPublisher "Local"
#define MyAppExeName "open-browser.cmd"
#define VcRedistPath "redist\\vc_redist.x64.exe"

#if FileExists(VcRedistPath)
  #define IncludeVcRedist
#endif

[Setup]
AppId={{A8B92A4F-4E56-45F4-9E8D-9D3A2D2A9F6F}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\..\release\installer
OutputBaseFilename=VueElementPlusAdmin-Setup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "..\\..\\release\\app\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "backend\\config.json"
Source: "..\\..\\release\\app\\backend\\config.json"; DestDir: "{app}\\backend"; Flags: onlyifdoesntexist
#ifdef IncludeVcRedist
Source: "{#VcRedistPath}"; DestDir: "{tmp}"; Flags: deleteafterinstall
#endif

[Run]
#ifdef IncludeVcRedist
Filename: "{tmp}\\vc_redist.x64.exe"; Parameters: "/quiet /norestart"; Flags: runhidden waituntilterminated
#endif
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\\bin\\configure-db.ps1"" -AppConfig ""{app}\\backend\\config.json"" -AdminConfig ""{app}\\backend\\config.admin.json"" -InitSqlDir ""{app}\\backend\\sql"""; Flags: runhidden waituntilterminated
Filename: "{app}\\bin\\install-service.cmd"; Flags: runhidden
Filename: "{app}\\bin\\open-browser.cmd"; Flags: postinstall skipifsilent

[UninstallRun]
Filename: "{app}\\bin\\uninstall-service.cmd"; Flags: runhidden

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\bin\\open-browser.cmd"
Name: "{commondesktop}\\{#MyAppName}"; Filename: "{app}\\bin\\open-browser.cmd"

[Code]
var
  DbPage: TInputQueryWizardPage;
  AdminPage: TInputQueryWizardPage;
  InitDbCheck: TNewCheckBox;

function JsonEscape(Value: string): string;
var
  S: string;
begin
  S := Value;
  StringChange(S, '\', '\\');
  StringChange(S, '"', '\"');
  Result := S;
end;

procedure InitializeWizard;
begin
  DbPage := CreateInputQueryPage(
    wpSelectDir,
    '数据库配置',
    '配置 MariaDB 连接',
    '安装程序会把配置写入 backend\config.json。若勾选初始化，将尝试创建数据库和用户。'
  );

  DbPage.Add('主机 (Host):', False);
  DbPage.Add('端口 (Port):', False);
  DbPage.Add('数据库名 (Database):', False);
  DbPage.Add('应用用户 (App User):', False);
  DbPage.Add('应用密码 (App Password):', True);

  DbPage.Values[0] := 'localhost';
  DbPage.Values[1] := '3307';
  DbPage.Values[2] := 'village';
  DbPage.Values[3] := 'app_user';
  DbPage.Values[4] := 'strongpass791002';

  AdminPage := CreateInputQueryPage(
    DbPage.ID,
    '管理员配置',
    '配置管理员账号',
    '用于初始化数据库和用户（内置 MariaDB 可留空管理员密码）。'
  );

  AdminPage.Add('管理员用户 (Admin User，可选):', False);
  AdminPage.Add('管理员密码 (Admin Password，可选):', True);
  AdminPage.Values[0] := 'root';
  AdminPage.Values[1] := '';

  InitDbCheck := TNewCheckBox.Create(AdminPage.Surface);
  InitDbCheck.Parent := AdminPage.Surface;
  InitDbCheck.Caption := '初始化数据库和用户（需要管理员账号）';
  InitDbCheck.Checked := True;
  InitDbCheck.Left := AdminPage.Edits[1].Left;
  InitDbCheck.Top := AdminPage.Edits[1].Top + AdminPage.Edits[1].Height + ScaleY(12);
end;

function ShouldInitDb: Boolean;
begin
  // Allow empty admin password and fallback admin user when left blank.
  Result := InitDbCheck.Checked;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  AppConfigPath: string;
  AdminConfigPath: string;
  Json: string;
  AdminJson: string;
  PortValue: string;
  AdminUser: string;
  AdminPass: string;
begin
  if CurStep = ssPostInstall then begin
    PortValue := Trim(DbPage.Values[1]);
    if PortValue = '' then PortValue := '3306';

    AppConfigPath := ExpandConstant('{app}\\backend\\config.json');
    Json :=
      '{' + #13#10 +
      '  "host": "' + JsonEscape(Trim(DbPage.Values[0])) + '",' + #13#10 +
      '  "user": "' + JsonEscape(Trim(DbPage.Values[3])) + '",' + #13#10 +
      '  "password": "' + JsonEscape(Trim(DbPage.Values[4])) + '",' + #13#10 +
      '  "database": "' + JsonEscape(Trim(DbPage.Values[2])) + '",' + #13#10 +
      '  "port": ' + PortValue + #13#10 +
      '}' + #13#10;
    SaveStringToFile(AppConfigPath, Json, False);

    if ShouldInitDb then begin
      AdminUser := Trim(AdminPage.Values[0]);
      if AdminUser = '' then
        AdminUser := 'root';
      AdminPass := AdminPage.Values[1];
      AdminConfigPath := ExpandConstant('{app}\\backend\\config.admin.json');
      AdminJson :=
        '{' + #13#10 +
        '  "host": "' + JsonEscape(Trim(DbPage.Values[0])) + '",' + #13#10 +
        '  "port": ' + PortValue + ',' + #13#10 +
        '  "user": "' + JsonEscape(AdminUser) + '",' + #13#10 +
        '  "password": "' + JsonEscape(AdminPass) + '"' + #13#10 +
        '}' + #13#10;
      SaveStringToFile(AdminConfigPath, AdminJson, False);
    end;
  end;
end;
