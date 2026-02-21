; Inno Setup Script
#define MyAppName "Vue Element Plus Admin"
#define MyAppVersion "3.0.0"
#define MyAppPublisher "Local"
#define MyAppExeName "open-browser.cmd"

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

[Run]
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\\bin\\configure-db.ps1"" -AppConfig ""{app}\\backend\\config.json"" -AdminConfig ""{app}\\backend\\config.admin.json"" -InitSqlDir ""{app}\\backend\\sql"""; Flags: runhidden
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
  DbPage.Add('管理员用户 (Admin User，可选):', False);
  DbPage.Add('管理员密码 (Admin Password，可选):', True);

  DbPage.Values[0] := 'localhost';
  DbPage.Values[1] := '3306';
  DbPage.Values[2] := 'village';
  DbPage.Values[3] := 'app_user';
  DbPage.Values[4] := 'strongpass791002';
  DbPage.Values[5] := 'root';
  DbPage.Values[6] := '';

  InitDbCheck := TNewCheckBox.Create(DbPage.Surface);
  InitDbCheck.Parent := DbPage.Surface;
  InitDbCheck.Caption := '初始化数据库和用户（需要管理员账号）';
  InitDbCheck.Checked := True;
  InitDbCheck.Left := DbPage.Edits[6].Left;
  InitDbCheck.Top := DbPage.Edits[6].Top + DbPage.Edits[6].Height + ScaleY(12);
end;

function ShouldInitDb: Boolean;
begin
  Result := InitDbCheck.Checked and (Trim(DbPage.Values[5]) <> '') and (Trim(DbPage.Values[6]) <> '');
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  AppConfigPath: string;
  AdminConfigPath: string;
  Json: string;
  AdminJson: string;
  PortValue: string;
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
      AdminConfigPath := ExpandConstant('{app}\\backend\\config.admin.json');
      AdminJson :=
        '{' + #13#10 +
        '  "host": "' + JsonEscape(Trim(DbPage.Values[0])) + '",' + #13#10 +
        '  "port": ' + PortValue + ',' + #13#10 +
        '  "user": "' + JsonEscape(Trim(DbPage.Values[5])) + '",' + #13#10 +
        '  "password": "' + JsonEscape(Trim(DbPage.Values[6])) + '"' + #13#10 +
        '}' + #13#10;
      SaveStringToFile(AdminConfigPath, AdminJson, False);
    end;
  end;
end;
