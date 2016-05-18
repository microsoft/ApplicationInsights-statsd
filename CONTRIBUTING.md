# Contributing to Application Insights StatdS backend

## Prerequisites

- Install [node](https://nodejs.org/)
- Upgrade [npm](https://www.npmjs.com/package/npm)
	```
	npm install -g npm
	```
- Install [typescript](http://www.typescriptlang.org/) via [npm](https://www.npmjs.com/package/npm) (`npm` will be installed with `node`)
	```
	npm install -g typescript@1.8.10
	```
- Install [gulp](https://www.npmjs.com/package/gulp) via [npm](https://www.npmjs.com/package/npm)
	```
    npm install -g gulp@3.9.1
	```
- Install [typings](https://github.com/typings/typings) via [npm](https://www.npmjs.com/package/npm)
	```
    npm install -g typings
	```
- Install one of
	- [Visual Studio Code](https://code.visualstudio.com/)
    
## Setup

- Install npm packages
    ```
    npm install
    ```
- Install typings
    ```
    typings install
    ```

## Contributing

- Ensure that it lints
	```
    gulp lint
    ```
- Ensure that it builds
	```
    gulp build
    ```
- Ensure that tests run and pass
	```
    gulp test
    ```