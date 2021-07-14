const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const convert = require("xml-js");
const inspect = require("util").inspect;
const { transliterate, slugify } = require("transliteration");

const DOCS_META = [
  {
    dir: "Myteam",
    title: "Myteam",
    field: "my_team",
  },
  {
    dir: "Teambox",
    title: "Teambox",
    field: "team_box",
  },
];
const DOCS_PATH = `${__dirname}/docs/`;
const DATA_PATH = `${__dirname}/data/`;
const TOPICS_IMG_PATH = `${__dirname}/static/images/topics/`;

const EXTENSION_IMG_REGEXP = /\.(jpe?g|png|gif|webp|bmp)$/;

const generateSectionData = async (sectionDirName) => {
  const sectionData = {
    maps: [],
    topics: [],
  };

  const fileNames = await fsPromises.readdir(`${DOCS_PATH}${sectionDirName}`);

  // const getWriteInStaticDirCollection = (names) =>
  //   names
  //     .filter((name) => EXTENSION_IMG_REGEXP.test(name))
  //     .map(async (name) => {
  //       const file = await fsPromises.readFile(`${DOCS_PATH}${sectionDirName}/${name}`);
  //       return fsPromises.writeFile(`${TOPICS_IMG_PATH}${name}`, file);
  //     });

  // // запись изображений в статическую дирректорию
  // Promise.all(getWriteInStaticDirCollection(fileNames));

  const mapsCatalog = await fsPromises.readdir(
    `${DOCS_PATH}${sectionDirName}/Maps`
  );
  const topicsCatalog = await fsPromises.readdir(
    `${DOCS_PATH}${sectionDirName}/Topics`
  );
  const mapsFile = await fsPromises.readFile(
    path.normalize(`${DOCS_PATH}${sectionDirName}/Maps/${mapsCatalog[0]}`)
  );

  sectionData.topics = await topicsCatalog.reduce(async (acc, fileName) => {
    const topicHrefName = fileName.replace(/\.(xml)$/, "");
    const topicFile = await fsPromises.readFile(
      path.normalize(`${DOCS_PATH}${sectionDirName}/Topics/${fileName}`)
    );
    const testFile = await fsPromises.readFile(
      path.normalize(`${DOCS_PATH}${sectionDirName}/Topics/${fileName}`), 'utf8'
    );
    const topicData = JSON.parse(
      convert.xml2json(topicFile, { compact: true, spaces: 4 })
    );
    // добавление дополнительного аттрибута для связи со списком maps
    topicData.topic._attributes.href = topicHrefName;
    return Promise.resolve([...(await acc), topicData.topic]);
  }, Promise.resolve([]));

  const mapsData = convert.xml2json(mapsFile, { compact: true, spaces: 4 });
  sectionData.maps = JSON.parse(mapsData).map.topicref;
  return sectionData;
};

const getItemMeta = (dirName) => {
  return { dir: dirName, title: dirName, field: slugify(dirName, { separator: '_' }) }
};

const generateDataForXML = async () => {
  const rootDir = await fsPromises.readdir(DOCS_PATH);
  return await rootDir.reduce(async (result, dir) => {
    try {
      const dataDir = await fsPromises.readdir(`${DOCS_PATH}/${dir}/`);

      const siteData = await dataDir.reduce(async (acc, dirName) => {
        const accData = await acc;
        const itemMeta = getItemMeta(dirName);
        console.log(itemMeta);
        if (!itemMeta) return accData;
        const { title, field } = itemMeta;
        const data = await generateSectionData(`${dir}/${dirName}`);
        return { ...accData, [field]: { title, data } };
      }, Promise.resolve({}));
      await fsPromises.writeFile(
        `${DATA_PATH}/${dir}/data.json`,
        JSON.stringify(siteData)
      );
      return { ... await result, [dir]: siteData};
    } catch (err) {
      console.error(err);
      const cacheData = await fsPromises.readFile(`${DATA_PATH}/${dir}/data.json`);
      return { ... await result, [dir]: JSON.parse(cacheData) };
    }
  }, Promise.resolve({}));
};
// console.log(inspect(sideBar, { colors: true, depth: Infinity }));
// await fsPromises.writeFile(`${DATA_PATH}sidebar_menu.json`, JSON.stringify(sideBar));
// console.log(data)

const createPage = async () => {
  const data = await generateDataForXML();
  const topicLinks = [];
  // const sideBar = Object.keys(data).map((key) => {
  //   const item = data[key];
  //   const { maps } = item.data;

  //   const generateMenuItems = (item, path) => {
  //     const { caption, topicref, _attributes } = item;
  //     const { href, type } = _attributes;
  //     const menuItem = {
  //       title: caption?._text || "-",
  //       href,
  //       type,
  //       subItems: [],
  //     };
  //     if (!topicref?.length) {
  //       topicLinks.push({ href, path: `${path}/${href}` });
  //       return menuItem;
  //     }
  //     return {
  //       ...menuItem,
  //       subItems: topicref.map((it) =>
  //         generateMenuItems(it, `${path}/${href}`)
  //       ),
  //     };
  //   };
  //   return {
  //     title: item.title,
  //     key,
  //     subItems: `${JSON.stringify(maps.map((el) => generateMenuItems(el)))}`,
  //   };
  // });

  // console.log(inspect(data, { colors: true, depth: Infinity }));
};
createPage();
