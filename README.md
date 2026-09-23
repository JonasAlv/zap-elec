# zap-elec

Simple and minimal whatsapp web wrapper made with TypeScript and Electron.
Focused on minimal resources usage.

## Dev

```bash
git clone https://github.com/JonasAlv/zap-elec.git
cd zap-elec
pnpm install
pnpm start
```

## Build

You can build packages locally using pnpm:

- **All Linux packages** (`deb`, `rpm`, `pacman`):
  ```bash
  pnpm build:linux
  ```
- **Individual Linux packages**:
  ```bash
  pnpm build:deb
  pnpm build:rpm
  pnpm build:pacman
  ```
- **Windows EXE installer**:
  ```bash
  pnpm build:exe
  # or
  pnpm build:win
  ```

Built packages are located in the `release/` directory.

## Install
It's on the AUR for Arch Linux users:
```bash
paru -S zap-elec
```
```bash
yay -S zap-elec
```
For other systems, download the desired package format from the [Releases page](https://github.com/JonasAlv/zap-elec/releases).
