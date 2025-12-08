# zap-elec

Simple and minimal whatsapp web wrapper made with Typescript and Electron.
Focused on minimal resources usage.

## Dev

```
git clone https://github.com/JonasAlv/zap-elec.git
cd zap-elec
yarn install
```

Note: check the `Script` section in `package.json` file to see build scripts.
steps to build:
```
yarn docker-pull
yarn docker
yarn install
yarn build --linux
```
for now windows building is not working on linux, but
if you are on windows you can build for windows without docker:
```
yarn install
yarn build --win
```


## install
It's on the AUR for arch linux users
```
paru -S zap-elec
```

```
yay -S zap-elec
```
For other systems you can go to the [Releases page](https://github.com/JonasAlv/zap-elec/releases) and download the desired format.
