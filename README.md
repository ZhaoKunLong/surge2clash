# surge2clash
convert surge config to clash

if you have any problem, welcome to post an issue


## Usage
- create `surgeText.js` file in the folder, and export surgeText. eg.
```js
const surgeText = `
[General]
bypass-system = true
loglevel = notify
replica = false
...
`
module.exports = surgeText
```

- In the surge2clash.js will import it.

- Then run it. you will get a `tempSurgeToCloud.yaml` file
```sh
npm install
npm run start
```

