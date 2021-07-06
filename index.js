const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const convert = require("xml-js");
const inspect = require("util").inspect;
const { transliterate, slugify } = require("transliteration");
const generateSectionData = require("./utils/genereteSectionData");

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


const getItemMeta = (dirName) => {
  return DOCS_META.find(({ dir }) => dirName.includes(dir));
};

const generateDataForXML = async () => {
  const rootDir = await fsPromises.readdir(DOCS_PATH);
  return await rootDir.reduce(async (result, dir) => {
    try {
      const dataDir = await fsPromises.readdir(`${DOCS_PATH}/${dir}/`);

      const siteData = await dataDir.reduce(async (acc, dirName) => {
        const accData = await acc;
        const itemMeta = getItemMeta(dirName);
        if (!itemMeta) return accData;
        const { title, field } = itemMeta;
        const data = await generateSectionData.generateSectionData(`${dir}/${dirName}`);
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
  console.log(data);
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
