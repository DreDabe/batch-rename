; 批量重命名工具安装脚本
; Inno Setup 脚本

[Setup]
AppName=批量重命名工具
AppVersion=1.0.0
AppPublisher=Developer
AppPublisherURL=https://example.com
AppSupportURL=https://example.com/support
AppUpdatesURL=https://example.com/updates
DefaultDirName={autopf}\批量重命名工具
DefaultGroupName=批量重命名工具
AllowNoIcons=yes
OutputDir=release
OutputBaseFilename=batch-rename-installer
Compression=lzma2/ultra
SolidCompression=yes

[Languages]
Name: "chinese"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "release\batch-rename-win32-x64\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\批量重命名工具"; Filename: "{app}\batch-rename.exe"
Name: "{group}\卸载 批量重命名工具"; Filename: "{uninstallexe}"
Name: "{commondesktop}\批量重命名工具"; Filename: "{app}\batch-rename.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\batch-rename.exe"; Description: "{cm:LaunchProgram,批量重命名工具}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"