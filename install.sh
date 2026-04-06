#!/bin/bash

set -e

APP_NAME="MarkdownViewer"
APP_DIR="$HOME/Applications/$APP_NAME.app"
CLI_PATH=$(which mdviewer 2>/dev/null || echo "")

# mdviewer CLI 설치 확인
if [ -z "$CLI_PATH" ]; then
  echo "Installing @ecsimsw/mdviewer..."
  npm install -g @ecsimsw/mdviewer
  CLI_PATH=$(which mdviewer)
fi

NODE_PATH=$(which node)

if [ -z "$NODE_PATH" ]; then
  echo "Error: node is not installed."
  exit 1
fi

echo "Building $APP_NAME.app..."

# .app 번들 생성
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/Resources"
mkdir -p "$APP_DIR/Contents/MacOS"

# AppleScript 소스
cat > /tmp/_mdviewer.applescript << APPLESCRIPT
on run
    set mdFiles to choose file of type {"md", "markdown"} with prompt "Select Markdown files" with multiple selections allowed
    set filePaths to {}
    repeat with f in mdFiles
        set end of filePaths to POSIX path of f
    end repeat
    convertFiles(filePaths)
end run

on open theFiles
    set filePaths to {}
    repeat with f in theFiles
        set p to POSIX path of f
        if p ends with ".md" or p ends with ".markdown" then
            set end of filePaths to p
        end if
    end repeat
    if (count of filePaths) > 0 then
        convertFiles(filePaths)
    end if
end open

on convertFiles(filePaths)
    repeat with f in filePaths
        do shell script "$NODE_PATH $CLI_PATH " & quoted form of f
    end repeat
end convertFiles
APPLESCRIPT

osacompile -o "$APP_DIR" /tmp/_mdviewer.applescript
rm /tmp/_mdviewer.applescript

# Info.plist 업데이트
defaults write "$APP_DIR/Contents/Info" CFBundleIdentifier -string "com.ecsimsw.markdown-viewer"
defaults write "$APP_DIR/Contents/Info" CFBundleDocumentTypes -array '{ CFBundleTypeName = Markdown; CFBundleTypeExtensions = (md, markdown); CFBundleTypeRole = Viewer; }'

# Launch Services 등록 + 기본 앱 설정
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_DIR"

if command -v duti &> /dev/null; then
  duti -s com.ecsimsw.markdown-viewer .md all
  duti -s com.ecsimsw.markdown-viewer .markdown all
  echo "Set as default app for .md files."
else
  echo "Optional: install duti (brew install duti) to set as default app for .md files."
fi

echo ""
echo "Installed: $APP_DIR"
echo "Done. Double-click any .md file to open with MarkdownViewer."
