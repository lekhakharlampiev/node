const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const convert = require("xml-js");
const inspect = require("util").inspect;
var glob = require("glob");

const DOCS_META = [
  {
    dir: 'Myteam',
    title: 'Myteam',
    field: 'my_team',
  },
  {
    dir: 'Teambox',
    title: 'Teambox',
    field: 'team_box',
  }
];

const generateSectionData = async (sectionDirName) => {
  const sectionData = {
    maps: [],
    topics: [],
  }

  const images = await fsPromises.readdir(`${docsDirPath}${sectionDirName}`);

  const mapsCatalog = await fsPromises.readdir(
    `${docsDirPath}${sectionDirName}/Maps`
  );
  const topicsCatalog = await fsPromises.readdir(
    `${docsDirPath}${sectionDirName}/Topics`
  );
  const mapsFile = await fsPromises.readFile(
    path.normalize(`${docsDirPath}${sectionDirName}/Maps/${mapsCatalog[0]}`)
  );

  sectionData.topics = await topicsCatalog.reduce(async (acc, fileName) => {
    const topicFile = await fsPromises.readFile(
      path.normalize(`${docsDirPath}${sectionDirName}/Topics/${fileName}`)
    );
    const topicData = JSON.parse(
      convert.xml2json(topicFile, { compact: true, spaces: 4 })
    );
    return Promise.resolve([...(await acc), topicData.topic]);
  }, Promise.resolve([]));

  const mapsData = convert.xml2json(mapsFile, { compact: true, spaces: 4 });
  sectionData.maps = JSON.parse(mapsData).map.topicref;
  return sectionData;
}

const getItemMeta = (dirName) => {
  return DOCS_META.find(({ dir }) => dirName.includes(dir));
}

const docsDirPath = `${__dirname}/docs/`;
const searchPath = async () => {

  try {
    const rootDir = await fsPromises.readdir(docsDirPath);

    const siteData = await rootDir.reduce(async (acc, dirName) => {
      const itemMeta = getItemMeta(dirName);
      if(!itemMeta) return acc;
      const { title, field } = itemMeta;
      const data = await generateSectionData(dirName);
      return { ...await acc, [field]: { title, data }}

    }, Promise.resolve({}));
   await fsPromises.writeFile("data/data.json", JSON.stringify(siteData));
   return siteData;
  } catch (err) {
    console.error(err);
    const cacheData = await fsPromises.readFile(`${__dirname}/data/data.json`);
    return JSON.parse(cacheData)
  }
};
const getData = async () => {
  const data = await searchPath();
  // console.log(data)
}

getData();