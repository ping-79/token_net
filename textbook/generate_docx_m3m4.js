const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat
} = require("docx");

// ===== 复用模块一二的辅助函数 =====
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
const imgBorder = { style: BorderStyle.SINGLE, size: 2, color: "E74C3C" };
const imgBorders = { top: imgBorder, bottom: imgBorder, left: imgBorder, right: imgBorder };
const PAGE_WIDTH = 11906;
const MARGIN_LEFT = 1440;
const MARGIN_RIGHT = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

function p(text, options = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, font: "Microsoft YaHei", size: options.size || 24, bold: options.bold, italics: options.italics, color: options.color }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t, font: "Microsoft YaHei", size: options.size || 24 }));
      else runs.push(new TextRun({ text: t.text, font: "Microsoft YaHei", size: t.size || options.size || 24, bold: t.bold, italics: t.italics, color: t.color }));
    });
  }
  return new Paragraph({ children: runs, heading: options.heading, alignment: options.alignment, spacing: options.spacing || { after: 120 }, indent: options.indent });
}

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: "Microsoft YaHei", size: 36, bold: true, color: "1A5276" })], spacing: { before: 360, after: 240 } });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: "Microsoft YaHei", size: 32, bold: true, color: "2E75B6" })], spacing: { before: 300, after: 200 } });
}
function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font: "Microsoft YaHei", size: 28, bold: true, color: "2C3E50" })], spacing: { before: 240, after: 160 } });
}
function heading4(text) {
  return new Paragraph({ children: [new TextRun({ text, font: "Microsoft YaHei", size: 26, bold: true, color: "34495E" })], spacing: { before: 200, after: 120 } });
}
function emptyLine() { return p("", { size: 12 }); }
function makeSep() { return new Paragraph({ children: [], spacing: { before: 120, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } } }); }

function makeTable(headers, rows, colWidths) {
  const tableRows = [];
  tableRows.push(new TableRow({ children: headers.map((h, i) => new TableCell({ borders, width: { size: colWidths[i], type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: h, font: "Microsoft YaHei", size: 22, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })] })) }));
  rows.forEach((row, ri) => {
    tableRows.push(new TableRow({ children: row.map((cell, ci) => new TableCell({ borders, width: { size: colWidths[ci], type: WidthType.DXA }, shading: ri % 2 === 0 ? { fill: "F2F7FB", type: ShadingType.CLEAR } : undefined, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: String(cell), font: "Microsoft YaHei", size: 22 })], spacing: { after: 40 } })] })) }));
  });
  return new Table({ width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: colWidths, rows: tableRows });
}

function imageSlot(id, title, content, size, source) {
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH], rows: [new TableRow({ children: [new TableCell({ borders: imgBorders, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, shading: { fill: "FDEDEC", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `[插图 ${id}]`, font: "Microsoft YaHei", size: 24, bold: true, color: "E74C3C" })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "图片标题：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: title, font: "Microsoft YaHei", size: 22 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "建议内容：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: content, font: "Microsoft YaHei", size: 22 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "建议尺寸：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: size, font: "Microsoft YaHei", size: 22 })] }),
    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: "建议来源：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: source, font: "Microsoft YaHei", size: 22 })] }),
  ] })] })] });
}

function tipBox(title, content, color = "27AE60", bgColor = "EAFAF1") {
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 2, color }, bottom: { style: BorderStyle.SINGLE, size: 2, color }, left: { style: BorderStyle.SINGLE, size: 6, color }, right: { style: BorderStyle.SINGLE, size: 2, color } }, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, shading: { fill: bgColor, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 150, right: 120 }, children: [
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, font: "Microsoft YaHei", size: 22, bold: true, color })] }),
    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: content, font: "Microsoft YaHei", size: 22 })] }),
  ] })] })] });
}

function codeBlock(lines) {
  const children = lines.map(line => new Paragraph({ spacing: { after: 20 }, indent: { left: 200 }, children: [new TextRun({ text: line, font: "Consolas", size: 20, color: "2C3E50" })] }));
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, left: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, right: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" } }, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, shading: { fill: "F8F9FA", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 150, right: 120 }, children })] })] });
}

function bulletItem(text, level = 0) {
  return new Paragraph({ numbering: { reference: "bullets", level }, children: [new TextRun({ text, font: "Microsoft YaHei", size: 24 })], spacing: { after: 60 } });
}
function bulletItemBold(boldText, normalText, level = 0) {
  return new Paragraph({ numbering: { reference: "bullets", level }, children: [new TextRun({ text: boldText, font: "Microsoft YaHei", size: 24, bold: true }), new TextRun({ text: normalText, font: "Microsoft YaHei", size: 24 })], spacing: { after: 60 } });
}

// ===== 构建模块三 =====
function buildModule3() {
  const c = [];

  c.push(heading1("模块三  图像生成 -- 建筑设计可视化"));
  c.push(emptyLine());
  c.push(tipBox("模块信息", "课时安排：理论8课时 + 实践8课时（本模块为全书核心）\n教学目标：\n1. 掌握AI图像生成的基本操作和主流工具\n2. 建立建筑效果图提示词体系（风格、空间、渲染、光影四大词库）\n3. 能用AI生成室内效果图、建筑效果图、规划鸟瞰图和景观意向图\n4. 掌握图生图、AI修图、逻辑推理生图等进阶技巧\n5. 了解AI图像在建筑安全领域的应用", "2E75B6", "EBF5FB"));
  c.push(emptyLine());
  c.push(tipBox("课程思政融入点", "- 文化自信：用AI重现\"样式雷\"建筑图档，展示AI在建筑文化遗产保护中的应用\n- 版权意识：AI生成图像的知识产权归属与合理使用\n- 安全意识：AI安全演示图在施工安全教育中的价值", "8E44AD", "F5EEF8"));
  c.push(emptyLine());

  // === 第7课时 ===
  c.push(heading2("第7课时  文生图基础"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "想象一下，你只需要用一句话描述\"一栋坐落在山间的现代清水混凝土别墅，大面积落地窗，黄昏时分\"，AI就能在几秒钟内为你生成一张精美的建筑效果图。这就是\"文生图\"技术的魅力。本课时将带你从零开始，学会用文字驱动AI生成建筑效果图。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、AI图像生成原理简介"));
  c.push(p("在模块一中我们已经了解到，AI图像生成的核心是扩散模型（Diffusion Model）。这里进一步理解它的工作流程："));
  c.push(emptyLine());
  c.push(imageSlot("3-1", "文生图工作流程图", "从左到右的流程：用户输入提示词（如\"现代别墅，黄昏\"） -> 文本编码器（将文字转换为AI能理解的数字） -> 扩散模型（从噪声逐步去噪生成图像） -> 输出效果图。每个步骤配简要说明和示意图标。", "通栏，高度约6cm", "自行绘制流程图（PPT/Canva）"));
  c.push(emptyLine());

  c.push(p([{ text: "简单理解文生图的三个步骤：", bold: true }]));
  c.push(bulletItemBold("第一步 - 理解文字：", "AI将你输入的提示词转换为内部语义表示（\"现代别墅\"=\"现代风格+独栋住宅+...\"）"));
  c.push(bulletItemBold("第二步 - 生成图像：", "AI从一张纯噪点图开始，根据文字语义一步步去除噪点，逐渐生成清晰图像"));
  c.push(bulletItemBold("第三步 - 输出结果：", "通常一次生成1-4张图像供你选择，可以继续优化或重新生成"));
  c.push(emptyLine());

  c.push(heading3("二、主流工具介绍与对比"));
  c.push(emptyLine());
  c.push(makeTable(
    ["工具", "优势", "不足", "建筑效果图推荐度", "费用"],
    [
      ["即梦AI", "操作简单，中文支持好，免费额度多", "高级参数控制较少", "\u2605\u2605\u2605\u2605\u2605", "免费/付费"],
      ["可灵AI", "效果出色，图视频一体化", "免费额度有限", "\u2605\u2605\u2605\u2605\u2605", "免费/付费"],
      ["Midjourney", "艺术性极强，建筑渲染风格好", "需科学上网，全英文", "\u2605\u2605\u2605\u2605\u2605", "付费"],
      ["Stable Diffusion", "开源免费，可深度定制", "需要一定技术基础", "\u2605\u2605\u2605\u2605", "免费"],
      ["通义万相", "免费，集成在通义千问中", "效果略逊一筹", "\u2605\u2605\u2605\u2606", "免费"],
    ],
    [1500, 2200, 1800, 1800, 1726]
  ));
  c.push(emptyLine());
  c.push(imageSlot("3-2", "五大图像生成工具界面对比", "五宫格布局，分别展示即梦AI、可灵AI、Midjourney、Stable Diffusion（WebUI）、通义万相的操作界面截图。每个截图标注工具名称。让学生对各工具界面有直观认识。", "通栏，高度约10cm", "自行截取各工具官网界面"));
  c.push(emptyLine());

  c.push(tipBox("教学建议", "本教材以即梦AI和可灵AI作为主要教学工具（国产、免费、中文友好），Midjourney作为进阶参考。建议学生至少注册其中两个平台。", "2E75B6", "EBF5FB"));
  c.push(emptyLine());

  c.push(heading3("三、基本操作流程"));
  c.push(p("以即梦AI为例，完整的文生图操作流程如下："));
  c.push(emptyLine());
  c.push(imageSlot("3-3", "即梦AI文生图操作步骤详解", "分步截图教程（4-6步）：1）打开即梦AI官网并登录；2）选择\"AI绘画\"或\"文生图\"功能；3）在输入框中输入提示词；4）选择图片比例和数量；5）点击生成并等待；6）查看结果、选择满意图片下载。每一步配界面截图和红色标注框。", "通栏，高度约14cm", "自行在即梦AI中操作并逐步截图"));
  c.push(emptyLine());

  c.push(heading3("四、实操：生成第一张建筑效果图"));
  c.push(p("让我们动手实践，生成你的第一张AI建筑效果图。"));
  c.push(emptyLine());

  c.push(p([{ text: "练习1：生成一张现代住宅效果图", bold: true, color: "2E75B6" }]));
  c.push(codeBlock([
    "提示词：",
    "一栋三层现代简约风格独栋别墅，白色外墙，大面积落地玻璃窗，",
    "平屋顶，前院有绿色草坪和一棵大树，蓝天白云背景，",
    "建筑摄影风格，日景，高清写实渲染",
  ]));
  c.push(emptyLine());

  c.push(p([{ text: "练习2：生成一张室内效果图", bold: true, color: "2E75B6" }]));
  c.push(codeBlock([
    "提示词：",
    "现代简约风格客厅室内效果图，浅灰色布艺沙发，原木色茶几，",
    "白色墙面，大落地窗外有城市景观，自然光线充足，",
    "室内设计杂志摄影风格，高清8K渲染",
  ]));
  c.push(emptyLine());

  c.push(p([{ text: "练习3：生成一张景观效果图", bold: true, color: "2E75B6" }]));
  c.push(codeBlock([
    "提示词：",
    "城市滨水公园景观效果图，木质栈道沿河岸延伸，",
    "两侧种植垂柳和樱花，远处有现代城市天际线，",
    "黄昏时分，金色阳光，鸟瞰45度视角，写实渲染",
  ]));
  c.push(emptyLine());

  c.push(imageSlot("3-4", "三个练习的AI生成效果图展示", "三栏并排展示用上述三个提示词在即梦AI中生成的效果图：左-现代住宅、中-室内客厅、右-滨水公园景观。每张图下方标注使用的提示词摘要。", "通栏，高度约8cm", "自行在即梦AI中使用上述提示词生成并截图"));
  c.push(emptyLine());

  c.push(tipBox("课堂思考", "对比三张效果图，你觉得AI生成图像的质量如何？有哪些令人惊喜的地方？又有哪些不够准确或不够专业的地方？", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  // === 第8课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第8课时  建筑效果图提示词体系"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "上一课时我们已经能用简单的提示词生成建筑效果图了。但你可能发现，不同的提示词写法会导致生成效果天差地别。本课时将建立一套系统化的建筑效果图提示词体系，包含四大词库：建筑风格、空间类型、渲染风格、光影氛围，让你能精准控制AI的视觉输出。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、提示词结构公式"));
  c.push(p([{ text: "建筑效果图提示词 = 主体描述 + 风格词 + 空间词 + 渲染词 + 光影词 + 画质词", bold: true, color: "2E75B6" }]));
  c.push(emptyLine());
  c.push(imageSlot("3-5", "建筑效果图提示词结构公式图", "横向公式图，六个色块依次排列：主体描述（蓝色）+ 风格词（橙色）+ 空间词（绿色）+ 渲染词（紫色）+ 光影词（黄色）+ 画质词（红色）。每个色块下方附一个示例词。", "通栏，高度约5cm", "自行绘制信息图"));
  c.push(emptyLine());

  c.push(heading3("二、建筑风格词库"));
  c.push(emptyLine());
  c.push(makeTable(
    ["风格分类", "中文关键词", "英文关键词（Midjourney适用）", "视觉特征"],
    [
      ["现代主义", "现代简约、极简主义", "modern, minimalist", "几何线条、大面积玻璃、简洁"],
      ["新中式", "新中式风格、中式现代", "new Chinese style", "传统元素+现代手法、木石材"],
      ["欧式古典", "欧式、古典主义", "European classical", "对称、柱式、穹顶、雕刻"],
      ["北欧", "北欧风格、斯堪的纳维亚", "Scandinavian, Nordic", "自然材料、浅色调、温馨"],
      ["日式", "日式、和风", "Japanese style, Zen", "木质、禅意、自然光、简素"],
      ["工业风", "工业风、LOFT", "industrial style, loft", "裸露砖墙/管道、金属、粗犷"],
      ["参数化", "参数化设计、未来主义", "parametric, futuristic", "曲面、流线型、科技感"],
      ["东南亚", "东南亚风格、热带", "tropical, Southeast Asian", "藤编、热带植物、开放空间"],
      ["地中海", "地中海风格", "Mediterranean style", "白墙蓝顶、拱门、陶砖"],
      ["Art Deco", "装饰艺术风格", "Art Deco", "几何图案、金属装饰、奢华"],
    ],
    [1500, 2000, 2800, 2726]
  ));
  c.push(emptyLine());

  c.push(heading3("三、空间类型词库"));
  c.push(makeTable(
    ["空间大类", "具体类型", "关键描述词"],
    [
      ["住宅", "别墅、公寓、联排别墅、四合院", "居住空间、家庭氛围、生活化"],
      ["商业", "购物中心、商业街、专卖店", "商业氛围、人流动线、展示性"],
      ["办公", "写字楼、联合办公、企业总部", "专业感、开放/私密、高效"],
      ["教育", "学校、图书馆、幼儿园", "活力、安全、启发性"],
      ["文化", "博物馆、美术馆、剧院", "艺术感、空间叙事、仪式感"],
      ["医疗", "医院、诊所、疗养院", "洁净、温馨、无障碍"],
      ["酒店", "度假酒店、民宿、精品酒店", "舒适、特色、体验感"],
      ["景观", "公园、广场、滨水空间、庭院", "生态、休闲、四季变化"],
    ],
    [1500, 3500, 4026]
  ));
  c.push(emptyLine());

  c.push(heading3("四、渲染风格词库"));
  c.push(makeTable(
    ["渲染风格", "关键词", "适用场景", "视觉特点"],
    [
      ["写实渲染", "写实、照片级、超写实、8K渲染", "正式方案效果图", "接近真实照片"],
      ["水彩手绘", "水彩、手绘效果、水彩插画", "概念方案、意向表达", "柔和、艺术感"],
      ["马克笔手绘", "马克笔手绘、建筑速写", "方案草图、设计构思", "线条感、速写风"],
      ["鸟瞰图", "鸟瞰、俯瞰、45度角鸟瞰", "规划总平面、园区展示", "全局视野"],
      ["透视图", "人视点、透视效果图", "建筑单体、街景展示", "真实视角"],
      ["轴测图", "轴测、等角透视、剖切轴测", "空间分析、功能展示", "无透视变形"],
      ["剖面图", "剖面效果图、剖透视", "空间关系展示", "内外关系清晰"],
      ["夜景渲染", "夜景、灯光效果、夜景渲染", "商业项目、景观照明", "灯光氛围"],
    ],
    [1500, 2500, 2500, 2526]
  ));
  c.push(emptyLine());

  c.push(heading3("五、光影氛围词库"));
  c.push(makeTable(
    ["氛围类型", "关键词", "适用场景"],
    [
      ["日景-晴天", "蓝天白云、阳光明媚、自然光充足", "大部分建筑效果图默认选择"],
      ["黄昏/日落", "黄昏、金色阳光、日落、暖色调", "营造温馨氛围，住宅和酒店常用"],
      ["夜景", "夜景、城市灯光、室内暖光溢出", "商业项目、景观照明展示"],
      ["阴天/雾天", "阴天、薄雾、柔和光线", "营造宁静、禅意氛围"],
      ["雨天", "雨天、地面反光、湿润质感", "特殊氛围表达"],
      ["雪景", "冬季、雪景、白雪覆盖", "北方项目、四季展示"],
      ["春季", "樱花、新绿、春光明媚", "景观项目春季效果"],
      ["秋季", "秋叶、金黄色调、层林尽染", "景观项目秋季效果"],
    ],
    [1800, 3600, 3626]
  ));
  c.push(emptyLine());

  c.push(heading3("六、提示词模板卡片"));
  c.push(p("以下模板可直接复制使用，替换方括号中的内容即可："));
  c.push(emptyLine());

  const promptCards = [
    { title: "模板1：建筑外观效果图", prompt: "[建筑类型]，[建筑风格]风格，[层数/体量描述]，[外墙材料]，[周边环境]，[渲染视角]，[光影氛围]，建筑摄影风格，高清写实渲染，8K" },
    { title: "模板2：室内空间效果图", prompt: "[空间类型]室内效果图，[设计风格]风格，[主要家具描述]，[材质和色彩]，[窗外景观]，[光线条件]，室内设计杂志摄影风格，高清渲染" },
    { title: "模板3：景观效果图", prompt: "[景观类型]效果图，[植物配置描述]，[地形和水体]，[硬质景观和小品]，[人物活动场景]，[渲染视角]，[季节和光影]，写实渲染，高清" },
    { title: "模板4：规划鸟瞰图", prompt: "[项目名称]规划鸟瞰图，[用地规模]，[建筑布局描述]，[道路系统]，[绿化和景观]，45度鸟瞰视角，[光影氛围]，写实渲染，高清" },
  ];

  promptCards.forEach(pc => {
    c.push(p([{ text: pc.title, bold: true, color: "2E75B6" }]));
    c.push(codeBlock([pc.prompt]));
    c.push(emptyLine());
  });

  c.push(imageSlot("3-6", "四种提示词模板生成效果对比", "四宫格布局，展示用上述四个模板分别生成的效果图：建筑外观、室内空间、景观效果、规划鸟瞰。每张图标注使用的模板编号。", "通栏，高度约10cm", "自行使用四个模板在AI中生成效果图并拼合"));
  c.push(emptyLine());

  // === 第9课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第9课时  室内设计AI可视化"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "室内设计是AIGC图像生成最成熟、效果最好的应用方向之一。本课时将深入学习如何用AI快速生成不同风格的室内效果图，掌握风格对比与快速方案探索的方法，学会将AI可视化工具应用到与业主的沟通中。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、不同风格室内效果图实操"));
  c.push(p("以\"客厅\"为统一空间，用不同的风格提示词生成对比效果图："));
  c.push(emptyLine());

  const styles = [
    { name: "现代简约", prompt: "现代简约风格客厅，灰白色调，布艺沙发，极简吊灯，落地窗，自然光线，高清写实渲染" },
    { name: "北欧风格", prompt: "北欧风格客厅，浅木色地板，米白色墙面，棉麻织物，绿植点缀，温暖自然光，高清写实" },
    { name: "新中式", prompt: "新中式风格客厅，胡桃木家具，水墨山水背景画，禅意茶台，暖色灯光，高端质感，高清渲染" },
    { name: "工业风", prompt: "工业风LOFT客厅，裸露红砖墙，黑色金属书架，皮质沙发，工业吊灯，大窗户，高清写实" },
    { name: "日式", prompt: "日式风格客厅，榻榻米，障子门，原木色家具，绿植，柔和自然光，极简禅意，高清渲染" },
  ];

  styles.forEach(s => {
    c.push(p([{ text: `${s.name}风格`, bold: true, color: "2E75B6" }]));
    c.push(codeBlock([s.prompt]));
    c.push(emptyLine());
  });

  c.push(imageSlot("3-7", "五种风格客厅效果图对比", "五宫格或横向排列，展示同一空间（客厅）五种不同风格的AI生成效果图，每张标注风格名称。形成强烈的风格对比视觉效果。", "通栏，高度约10cm", "自行用上述提示词在AI中生成五种风格客厅效果图并拼合"));
  c.push(emptyLine());

  c.push(heading3("二、不同空间类型实操"));
  c.push(p("以\"新中式\"为统一风格，生成不同空间类型的效果图："));
  c.push(emptyLine());

  const spaces = ["卧室", "餐厅", "书房", "茶室", "酒店大堂"];
  spaces.forEach(s => c.push(bulletItem(`新中式风格${s}效果图`)));
  c.push(emptyLine());
  c.push(imageSlot("3-8", "新中式风格不同空间效果图集", "五宫格展示新中式风格的五个不同空间：卧室、餐厅、书房、茶室、酒店大堂。统一风格但空间功能各异，展示AI在不同室内空间中的表现力。", "通栏，高度约10cm", "自行生成并拼合"));
  c.push(emptyLine());

  c.push(heading3("三、快速方案探索与业主沟通"));
  c.push(p([{ text: "实际应用场景：", bold: true }]));
  c.push(p("业主说：\"我想要一个温馨舒适的客厅，但我不确定喜欢什么风格。\""));
  c.push(p("传统做法：设计师凭经验推荐，制作1-2个方案效果图（耗时数天）。"));
  c.push(p([{ text: "AIGC做法：", bold: true, color: "2E75B6" }, { text: "当场用AI生成5-10种风格效果图（耗时5分钟），业主即时选择喜欢的方向。" }]));
  c.push(emptyLine());
  c.push(imageSlot("3-9", "AI辅助业主沟通场景示意", "模拟场景图：设计师和业主面对面，电脑屏幕上展示AI生成的多种风格效果图。配文字说明工作流程：业主描述需求 -> 设计师编写提示词 -> AI即时生成 -> 业主当场选择 -> 确定设计方向。", "通栏，高度约8cm", "拍摄实际场景照片或用AI生成模拟场景图"));
  c.push(emptyLine());

  // === 第10课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第10课时  城乡规划与园林景观AI可视化"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "除了室内设计，AIGC在城乡规划和园林景观方向也有广泛的应用。本课时将学习如何用AI生成城市鸟瞰图、街景效果图、景观意向图和景观节点效果图，并探索规划分析图的AI辅助表达。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、城市规划可视化"));
  c.push(heading4("1.1 城市鸟瞰图生成"));
  c.push(codeBlock([
    "提示词示例：",
    "现代化城市新区鸟瞰规划效果图，整齐的住宅组团排列，",
    "中央景观轴线贯穿南北，商业综合体位于核心区域，",
    "绿化覆盖率高，道路系统清晰，人工湖水景，",
    "45度鸟瞰视角，日景晴天，写实渲染，高清8K",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("3-10", "AI生成城市鸟瞰规划图示例", "展示2-3张不同类型的AI城市鸟瞰图：1）住宅新区 2）商业中心 3）产业园区。每张配简要说明。", "通栏，高度约8cm", "自行用AI生成"));
  c.push(emptyLine());

  c.push(heading4("1.2 城市街景效果图"));
  c.push(codeBlock([
    "提示词示例：",
    "城市商业步行街效果图，人视点透视，两侧为2-3层商业建筑，",
    "底层商铺有玻璃橱窗，街道铺装为花岗岩，中间有景观树池，",
    "行人漫步，黄昏暖色灯光，商业氛围浓厚，写实渲染",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("3-11", "AI生成城市街景效果图示例", "展示2张不同类型的街景效果图：1）商业步行街日景 2）居住区内部道路黄昏景。对比不同场景的生成效果。", "通栏，高度约8cm", "自行用AI生成"));
  c.push(emptyLine());

  c.push(heading3("二、园林景观可视化"));
  c.push(heading4("2.1 景观意向图生成"));
  c.push(p("景观意向图是方案初期表达设计方向的重要工具。AI可以快速生成多种风格的景观意向图："));
  c.push(emptyLine());
  c.push(imageSlot("3-12", "AI生成的多种景观意向图", "六宫格展示不同类型的景观意向图：1）中式园林 2）日式枯山水 3）现代极简庭院 4）热带风情花园 5）儿童活动场地 6）滨水步道。每张配风格标签。", "通栏，高度约10cm", "自行用AI生成六种风格景观意向图并拼合"));
  c.push(emptyLine());

  c.push(heading4("2.2 景观节点效果图"));
  c.push(codeBlock([
    "提示词示例（入口景观节点）：",
    "住宅小区入口景观效果图，新中式风格，景墙上有镂空图案，",
    "入口两侧对称种植造型松，地面铺装为深灰色花岗岩，",
    "嵌入式地面灯带，黄昏暖光，人视点透视，写实渲染",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("3-13", "AI生成景观节点效果图示例", "展示3种常见景观节点的AI效果图：1）小区入口景观 2）中心景观水景 3）休闲廊架空间。每张配提示词摘要。", "通栏，高度约8cm", "自行用AI生成"));
  c.push(emptyLine());

  c.push(heading4("2.3 规划分析图AI辅助表达"));
  c.push(p("AI还可以辅助制作规划分析中常用的概念图："));
  c.push(bulletItem("功能分区分析图（不同色块表示不同功能区域）"));
  c.push(bulletItem("交通流线分析图（用箭头和线条表示车行/人行动线）"));
  c.push(bulletItem("景观视线分析图（标注重要景观视廊）"));
  c.push(emptyLine());
  c.push(tipBox("注意", "AI生成的分析图在精确性上可能不足，适合用于概念阶段的快速表达，正式分析图仍需使用专业软件制作。", "E74C3C", "FDEDEC"));
  c.push(emptyLine());

  // === 第11课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第11课时  图生图与AI修图"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "\"文生图\"的局限在于纯文字描述难以精确控制建筑的造型和空间关系。\"图生图\"技术弥补了这一不足 -- 你可以上传一张手绘草图、SketchUp白模截图甚至是现场照片，AI在此基础上生成精美的效果图，同时保持原始设计的基本造型和空间关系。这对建筑专业来说极其实用。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、手绘草图 -> AI效果图"));
  c.push(p("这是建筑专业最具价值的AI应用之一：将设计初期的手绘草图直接转化为写实效果图。"));
  c.push(emptyLine());
  c.push(imageSlot("3-14", "手绘草图转AI效果图全流程", "左中右三栏：左-建筑手绘草图原图（黑白线稿）；中-AI平台操作界面（上传图片+输入提示词）；右-AI生成的写实效果图。中间用箭头连接，标注关键操作步骤。展示从粗糙草图到精美效果图的惊人转变。", "通栏，高度约8cm", "自行手绘一张建筑草图 -> 上传到AI工具 -> 截图展示转换效果"));
  c.push(emptyLine());

  c.push(p([{ text: "操作步骤：", bold: true }]));
  c.push(bulletItem("1. 准备手绘草图（可以用纸笔绘制后拍照，或用iPad手绘）"));
  c.push(bulletItem("2. 在AI平台选择\"图生图\"或\"参考图\"功能"));
  c.push(bulletItem("3. 上传手绘草图作为参考图"));
  c.push(bulletItem("4. 输入风格和渲染相关的提示词"));
  c.push(bulletItem("5. 调整\"参考强度\"参数（强度越高，越忠于原图造型）"));
  c.push(bulletItem("6. 生成效果图并选择满意的结果"));
  c.push(emptyLine());

  c.push(heading3("二、SketchUp白模 -> AI渲染"));
  c.push(p("对于已有SketchUp建模基础的同学，这是一个极其实用的工作流："));
  c.push(emptyLine());
  c.push(codeBlock([
    "工作流程：",
    "SketchUp建立简单白模 -> 导出合适角度的截图",
    "-> 上传到AI平台作为参考图 -> 输入风格/材质/环境描述",
    "-> AI生成带材质、光影、环境的完整效果图",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("3-15", "SketchUp白模转AI效果图对比", "上下两行对比：上行3张SketchUp白模截图（建筑外观、室内、景观各一）；下行3张AI渲染后的效果图。形成强烈的\"白模 -> 渲染\"视觉对比。", "通栏，高度约10cm", "自行在SketchUp中建白模并截图 -> 用AI转换为效果图"));
  c.push(emptyLine());

  c.push(heading3("三、AI修图：局部修改与风格转换"));
  c.push(heading4("3.1 局部修改（局部重绘/Inpainting）"));
  c.push(p("AI可以对生成的效果图进行局部修改，只改变选定区域，保持其他部分不变："));
  c.push(bulletItem("更换建筑外墙材料（如将白色涂料改为木饰面）"));
  c.push(bulletItem("更换室内家具或软装"));
  c.push(bulletItem("修改景观植物配置"));
  c.push(bulletItem("替换天空背景"));
  c.push(emptyLine());
  c.push(imageSlot("3-16", "AI局部修图效果展示", "展示一张室内效果图的局部修改过程：原图 -> 用画笔选择要修改的区域（红色蒙版）-> 输入修改指令（如\"将灰色沙发替换为棕色皮质沙发\"）-> 修改后的效果图。四步流程，横向排列。", "通栏，高度约8cm", "自行在支持局部重绘的AI工具中操作并截图"));
  c.push(emptyLine());

  c.push(heading4("3.2 风格转换"));
  c.push(p("将同一空间快速转换为不同设计风格，非常适合方案对比："));
  c.push(emptyLine());
  c.push(imageSlot("3-17", "AI风格转换效果展示", "以一张室内效果图为基础，展示转换为三种不同风格的效果：原图（现代简约）-> 转换为新中式 -> 转换为北欧 -> 转换为工业风。四张图横向排列对比。", "通栏，高度约8cm", "自行在AI工具中使用风格转换功能生成"));
  c.push(emptyLine());

  c.push(heading3("四、ControlNet/参考图控制生成"));
  c.push(p("ControlNet是Stable Diffusion中的一项重要技术，可以精确控制AI生成图像的结构、边缘和深度。在建筑领域的核心价值是：保持建筑结构不变，只改变风格和材质。"));
  c.push(emptyLine());
  c.push(makeTable(
    ["控制模式", "原理", "建筑应用"],
    [
      ["Canny边缘", "提取图片边缘线条作为生成引导", "保持建筑轮廓不变，改变材质和风格"],
      ["Depth深度", "提取图片深度信息作为生成引导", "保持空间进深关系，改变装修风格"],
      ["Lineart线稿", "提取或使用线稿作为生成引导", "手绘线稿直接转效果图"],
      ["Segmentation语义", "按区域分割图片作为生成引导", "精确控制不同区域的材质和颜色"],
    ],
    [2000, 3013, 4013]
  ));
  c.push(emptyLine());
  c.push(tipBox("提示", "即梦AI和可灵AI已内置类似ControlNet的功能，操作更简单。Stable Diffusion的ControlNet插件提供更精细的控制，但需要一定技术基础。", "2E75B6", "EBF5FB"));
  c.push(emptyLine());

  // === 第12课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第12课时  逻辑推理生图与高级技巧"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "随着AI模型能力的提升，AI不仅能根据文字\"画图\"，还能理解复杂的空间逻辑关系。本课时将探索AI理解设计意图、多轮对话优化方案、一致性控制等高级技巧。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、AI理解设计意图"));
  c.push(p("新一代多模态AI模型（如GPT-4o、Claude等）可以理解复杂的空间描述，并生成合理的建筑布局："));
  c.push(emptyLine());
  c.push(codeBlock([
    "提示词示例（空间逻辑描述）：",
    "一栋两层独栋住宅。一层设置客厅和厨房，客厅在南侧，",
    "有大面积落地窗面向花园；厨房在北侧，与餐厅相连。",
    "二层设置三间卧室，主卧在南侧带独立卫生间和阳台。",
    "楼梯位于房屋中央。整体风格为现代简约。",
    "请生成这栋住宅的外观透视效果图。",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("3-18", "AI理解空间逻辑生成的建筑效果图", "展示用上述复杂空间描述生成的建筑效果图，标注AI如何理解和表达了\"南侧落地窗\"、\"两层体量\"等空间逻辑关系。可以配上一张简单平面图与效果图对比。", "通栏，高度约8cm", "自行在AI中输入空间描述并生成"));
  c.push(emptyLine());

  c.push(heading3("二、多轮对话优化设计方案"));
  c.push(p("利用支持多轮对话的AI（如GPT-4o、Kimi），可以像与设计助手对话一样逐步优化效果图："));
  c.push(emptyLine());
  c.push(codeBlock([
    "第1轮：生成初始方案 -> \"一栋现代简约别墅效果图\"",
    "第2轮：调整风格 -> \"将外墙改为木饰面和清水混凝土结合\"",
    "第3轮：增加细节 -> \"在入口处增加一个悬挑雨篷\"",
    "第4轮：改变氛围 -> \"改为黄昏时分，室内灯光透出\"",
    "第5轮：切换视角 -> \"请从花园方向看向建筑生成效果图\"",
  ]));
  c.push(emptyLine());

  c.push(heading3("三、一致性控制"));
  c.push(p("在建筑项目中，我们需要同一个建筑的不同视角和场景保持一致。这是目前AI图像生成的一大挑战。"));
  c.push(emptyLine());
  c.push(p([{ text: "保持一致性的实用技巧：", bold: true }]));
  c.push(bulletItem("使用同一个对话/项目中连续生成不同视角"));
  c.push(bulletItem("在提示词中明确描述建筑的固定特征（材质、色彩、体量）"));
  c.push(bulletItem("使用图生图功能：以第一张效果图为基准生成其他视角"));
  c.push(bulletItem("使用\"种子值\"（Seed）：部分工具支持固定随机种子，提高一致性"));
  c.push(emptyLine());
  c.push(imageSlot("3-19", "同一建筑项目多视角一致性效果图", "展示同一建筑项目的4个不同视角：正立面、侧立面、后花园方向、鸟瞰。4张图保持建筑造型和材质的一致性。标注保持一致性使用的技巧。", "通栏，高度约8cm", "自行在AI中尝试生成同一建筑不同视角"));
  c.push(emptyLine());

  // === 第13课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第13课时  建筑安全演示图生成"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "建筑行业是安全管理的重点领域。AI可以快速生成各类安全演示图，用于施工现场安全培训、消防安全教育等场景。本课时将学习如何用AI生成高质量的建筑安全培训视觉素材。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、施工现场安全警示图"));
  c.push(codeBlock([
    "提示词示例：",
    "施工现场安全教育宣传海报，卡通风格，展示工人正确佩戴",
    "安全帽、反光背心、安全鞋的形象，背景为建筑施工现场，",
    "标注\"安全第一\"文字，明亮的色彩，专业插画风格",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("3-20", "AI生成的施工安全警示图示例", "展示3-4张AI生成的施工安全宣传图：1）正确穿戴防护装备 2）高处作业安全规范 3）临时用电安全 4）文明施工。卡通或写实风格均可。", "通栏，高度约8cm", "自行用AI生成安全主题图片"));
  c.push(emptyLine());

  c.push(heading3("二、消防逃生示意图"));
  c.push(p("AI可以辅助生成消防逃生路线的示意图和培训材料："));
  c.push(emptyLine());
  c.push(imageSlot("3-21", "AI辅助生成的消防安全示意图", "展示2张AI生成的消防相关图片：1）建筑内部消防逃生路线示意图（俯视角度，标注逃生方向）2）消防安全培训宣传图（展示灭火器使用方法等）。", "通栏，高度约8cm", "自行用AI生成并标注"));
  c.push(emptyLine());

  c.push(heading3("三、安全培训教材插图"));
  c.push(p("AI可以为安全培训教材快速生成配套插图，减少素材收集的时间成本："));
  c.push(bulletItem("基坑支护安全示意图"));
  c.push(bulletItem("脚手架搭设规范示意图"));
  c.push(bulletItem("吊装作业安全区域示意图"));
  c.push(bulletItem("安全防护网设置示意图"));
  c.push(emptyLine());

  c.push(tipBox("重要提醒", "AI生成的安全演示图仅用于培训教育和宣传，不能作为正式的安全技术文件。安全技术文件必须由持证安全工程师编制。AI生成的安全图片中可能存在技术细节错误，使用前必须经过安全专业人员审核。", "E74C3C", "FDEDEC"));
  c.push(emptyLine());

  // === 第14课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第14课时  图像生成综合实训"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "本课时是模块三的综合实训环节。学生将综合运用前7个课时学到的所有图像生成技能，为一个模拟建筑项目生成全套可视化图纸，并进行作品展示和互评。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、综合实训任务"));
  c.push(p([{ text: "任务：为一个建筑项目生成全套AI可视化图纸", bold: true, color: "2E75B6" }]));
  c.push(emptyLine());
  c.push(p("每位学生（或2人一组）选择以下项目之一，完成全套可视化："));
  c.push(emptyLine());
  c.push(makeTable(
    ["专业方向", "项目选题", "可视化要求"],
    [
      ["城乡规划", "某乡村振兴示范点规划", "鸟瞰图1张+街景2张+节点效果图2张"],
      ["建筑设计", "某山地度假民宿设计", "建筑外观3个视角+室内2张"],
      ["室内设计", "某精品咖啡馆室内设计", "5个不同空间效果图"],
      ["园林景观", "某社区口袋公园景观设计", "鸟瞰1张+节点效果图3张+意向图2张"],
    ],
    [1800, 3000, 4226]
  ));
  c.push(emptyLine());

  c.push(heading3("二、实训步骤"));
  c.push(p([{ text: "步骤1：项目定义（10分钟）", bold: true }]));
  c.push(bulletItem("确定项目基本信息（名称、地点、风格、规模）"));
  c.push(bulletItem("明确需要生成的效果图清单"));
  c.push(emptyLine());

  c.push(p([{ text: "步骤2：提示词编写（20分钟）", bold: true }]));
  c.push(bulletItem("使用四大词库编写各张效果图的提示词"));
  c.push(bulletItem("确保同一项目各图之间风格一致"));
  c.push(emptyLine());

  c.push(p([{ text: "步骤3：AI生成（30分钟）", bold: true }]));
  c.push(bulletItem("在AI平台中逐一生成效果图"));
  c.push(bulletItem("对不满意的图进行优化调整"));
  c.push(bulletItem("尝试使用图生图和局部修图提升效果"));
  c.push(emptyLine());

  c.push(p([{ text: "步骤4：图纸整理（15分钟）", bold: true }]));
  c.push(bulletItem("将所有效果图整理编号"));
  c.push(bulletItem("为每张图添加标题和简要说明"));
  c.push(bulletItem("整合成一份完整的可视化方案集"));
  c.push(emptyLine());

  c.push(p([{ text: "步骤5：展示与互评（45分钟）", bold: true }]));
  c.push(bulletItem("每组用2-3分钟展示作品并说明设计意图"));
  c.push(bulletItem("其他同学提问和评价"));
  c.push(bulletItem("全班投票评选最佳作品"));
  c.push(emptyLine());

  c.push(heading3("三、评分标准"));
  c.push(makeTable(
    ["评分维度", "占比", "评分要点"],
    [
      ["提示词质量", "20%", "是否使用了系统化的提示词体系，词库运用是否准确"],
      ["图像质量", "25%", "生成图像的清晰度、美观度、专业感"],
      ["专业准确性", "20%", "建筑造型、空间关系、材质搭配是否符合专业要求"],
      ["一致性", "15%", "同一项目各图之间的风格、色调、材质是否统一"],
      ["展示表达", "10%", "图纸整理是否规范、展示是否清晰"],
      ["创意性", "10%", "设计理念是否有特色、AI工具运用是否有新意"],
    ],
    [1800, 1000, 6226]
  ));
  c.push(emptyLine());

  c.push(heading3("四、AI生成图像的版权讨论"));
  c.push(p("在综合实训的最后，让我们讨论一个重要话题：AI生成图像的版权归属。"));
  c.push(emptyLine());
  c.push(makeTable(
    ["问题", "现状"],
    [
      ["AI生成的图像有版权吗？", "各国法律仍在探索中，目前多数国家倾向于\"纯AI生成的图像不受版权保护\""],
      ["设计师使用AI图像是否侵权？", "使用AI工具本身不侵权，但如果提示词中指定\"模仿某设计师的风格\"可能存在争议"],
      ["AI效果图能否用于商业投标？", "目前无明确法律禁止，但应在文件中标注AI辅助生成"],
      ["教学中使用AI图像是否合规？", "属于教育合理使用，但建议标注生成工具和提示词"],
    ],
    [3500, 5526]
  ));
  c.push(emptyLine());
  c.push(tipBox("课程思政", "版权和知识产权意识是建筑从业者的基本职业素养。在使用AI生成内容时，我们要尊重他人的知识产权，也要了解自身权益的保护。诚信使用AI，标注AI参与，这是新时代建筑从业者应有的职业操守。", "8E44AD", "F5EEF8"));
  c.push(emptyLine());

  // 本章小结
  c.push(makeSep());
  c.push(heading3("本章小结"));
  c.push(makeTable(
    ["知识点", "核心内容"],
    [
      ["文生图基础", "扩散模型原理，主流工具操作，基本提示词"],
      ["提示词体系", "四大词库：建筑风格、空间类型、渲染风格、光影氛围"],
      ["室内可视化", "多风格对比生成，业主沟通应用"],
      ["规划景观可视化", "鸟瞰图、街景图、景观意向图、节点效果图"],
      ["图生图", "手绘转效果图、白模转渲染、局部修图、风格转换"],
      ["高级技巧", "逻辑推理生图、多轮对话优化、一致性控制"],
      ["安全应用", "施工安全警示图、消防逃生图、培训插图"],
      ["版权意识", "AI图像版权归属与合理使用"],
    ],
    [2500, 6526]
  ));
  c.push(emptyLine());

  c.push(imageSlot("3-22", "本章配套资源二维码", "包含两个二维码并排：1）\"扫码获取建筑效果图提示词库\"（链接小程序）；2）\"扫码观看AI图像生成视频教程\"（链接小程序）。", "半栏（居中），高度约5cm", "待小程序上线后生成二维码"));

  return c;
}

// ===== 构建模块四 =====
function buildModule4() {
  const c = [];

  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading1("模块四  音视频生成 -- 方案展示"));
  c.push(emptyLine());
  c.push(tipBox("模块信息", "课时安排：理论4课时 + 实践4课时\n教学目标：\n1. 掌握AI文字转语音和播客生成技术\n2. 能用AI生成建筑方案展示视频（文生视频、图生视频）\n3. 了解数字人技术和参照视频生成\n4. 能将AI生成的多段素材剪辑整合为完整方案展示视频", "2E75B6", "EBF5FB"));
  c.push(emptyLine());
  c.push(tipBox("课程思政融入点", "- 创新精神：用AI视频技术创新建筑方案的展示方式\n- 文化传播：用AI制作中国建筑文化宣传视频\n- 行业应用：AI视频在文旅项目宣传中的价值", "8E44AD", "F5EEF8"));
  c.push(emptyLine());

  // === 第15课时 ===
  c.push(heading2("第15课时  音频生成"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "音频是建筑方案展示中容易被忽视但非常重要的元素。一段专业的配音可以大幅提升方案汇报的感染力，一首合适的背景音乐可以营造出项目的氛围。本课时将学习如何用AI快速生成专业配音和背景音乐。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、文字转语音（TTS）"));
  c.push(heading4("1.1 应用场景"));
  c.push(makeTable(
    ["场景", "具体应用", "配音风格建议"],
    [
      ["方案汇报配音", "为方案展示PPT或视频配专业旁白", "沉稳大气、普通话标准"],
      ["项目宣传片配音", "为建筑项目宣传片配旁白", "感性温暖或大气磅礴"],
      ["课程录制", "为在线教学视频配讲解音频", "亲切自然、节奏适中"],
      ["语音导览", "为建筑展馆或景区制作语音导览", "专业清晰、信息量适当"],
    ],
    [2000, 3526, 3500]
  ));
  c.push(emptyLine());

  c.push(heading4("1.2 常用工具与操作"));
  c.push(p([{ text: "推荐工具：", bold: true }]));
  c.push(bulletItemBold("豆包/剪映：", "字节跳动出品，音色丰富，中文效果好，免费"));
  c.push(bulletItemBold("通义听悟：", "阿里出品，支持语音转文字和文字转语音"));
  c.push(bulletItemBold("微软Azure TTS：", "音色自然，支持情感调节，需付费"));
  c.push(emptyLine());

  c.push(imageSlot("4-1", "文字转语音操作步骤截图", "以豆包/剪映为例的分步截图教程：1）选择\"文字转语音\"功能；2）粘贴方案汇报文稿；3）选择音色（推荐几种适合建筑汇报的音色）；4）调整语速和语调；5）试听并导出。", "通栏，高度约10cm", "自行在豆包/剪映中操作并截图"));
  c.push(emptyLine());

  c.push(p([{ text: "实操练习：", bold: true, color: "2E75B6" }]));
  c.push(p("将模块二中生成的设计说明书中的\"设计理念\"部分（约200字），用AI转换为专业配音。"));
  c.push(emptyLine());

  c.push(heading3("二、双人播客生成"));
  c.push(p("NotebookLM（Google）可以将文档资料自动生成双人对话形式的播客音频，非常适合建筑知识的趣味传播："));
  c.push(emptyLine());
  c.push(p([{ text: "应用场景：", bold: true }]));
  c.push(bulletItem("将建筑规范解读转化为双人讨论式播客"));
  c.push(bulletItem("将建筑案例分析转化为访谈式播客"));
  c.push(bulletItem("将课程讲义转化为学习辅助播客"));
  c.push(emptyLine());
  c.push(imageSlot("4-2", "NotebookLM双人播客生成操作截图", "展示NotebookLM操作界面：1）上传PDF文档或粘贴文字内容；2）点击\"生成播客\"；3）生成的双人对话播客播放界面。标注中文支持情况和使用限制。", "通栏，高度约8cm", "自行在NotebookLM中上传一份建筑相关资料并生成播客截图"));
  c.push(emptyLine());

  c.push(heading3("三、AI音乐生成"));
  c.push(p("为建筑方案展示视频配上合适的背景音乐，可以大幅提升展示效果："));
  c.push(emptyLine());
  c.push(makeTable(
    ["项目类型", "音乐风格建议", "Suno提示词参考"],
    [
      ["高端住宅", "轻柔钢琴曲、温馨弦乐", "soft piano, warm strings, elegant, residential"],
      ["商业综合体", "现代电子、活力节奏", "modern electronic, upbeat, commercial, urban"],
      ["文化建筑", "大气交响乐、中国风", "orchestral, grand, Chinese traditional instruments"],
      ["园林景观", "自然环境音、轻音乐", "nature sounds, gentle flute, peaceful, garden"],
      ["乡村项目", "民谣吉他、田园风", "acoustic guitar, folk, pastoral, countryside"],
    ],
    [1800, 3000, 4226]
  ));
  c.push(emptyLine());
  c.push(imageSlot("4-3", "Suno音乐生成操作截图", "展示Suno操作界面：输入音乐风格描述 -> 选择时长 -> 生成音乐 -> 试听和下载。展示一首为建筑项目生成的背景音乐的波形图。", "通栏，高度约6cm", "自行在Suno中生成一首建筑项目背景音乐并截图"));
  c.push(emptyLine());

  // === 第16课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第16课时  文生视频与图生视频"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "如果说AI图像生成让\"一句话出效果图\"成为现实，那么AI视频生成则更进一步 -- 让\"一段话出漫游动画\"、\"一张图出展示视频\"成为可能。本课时将学习文生视频和图生视频两大核心技术。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、文生视频"));
  c.push(p("文生视频（Text-to-Video）：输入文字描述，AI直接生成视频。"));
  c.push(emptyLine());
  c.push(codeBlock([
    "提示词示例：",
    "镜头缓缓推进，展示一栋现代玻璃幕墙办公楼的外观，",
    "蓝天白云倒映在玻璃幕墙上，楼前广场上有行人走过，",
    "镜头从底部向上摇，展示建筑全貌，日景，电影质感",
  ]));
  c.push(emptyLine());
  c.push(imageSlot("4-4", "文生视频效果展示（关键帧截图）", "展示用上述提示词在可灵AI中生成视频的关键帧截图：从视频中截取4-6帧画面，按时间顺序排列，展示镜头运动效果（推进、上摇）。配注释说明每帧的内容。", "通栏，高度约6cm", "自行在可灵AI中生成视频并截取关键帧"));
  c.push(emptyLine());

  c.push(heading3("二、图生视频"));
  c.push(p("图生视频是建筑领域最实用的AI视频生成方式 -- 将模块三生成的效果图\"动起来\"："));
  c.push(emptyLine());

  c.push(heading4("2.1 单图生视频"));
  c.push(p("上传一张建筑效果图，AI自动生成镜头运动的视频："));
  c.push(emptyLine());
  c.push(imageSlot("4-5", "单图生视频操作流程与效果", "三步流程：1）上传建筑效果图；2）选择镜头运动方式（推进/环绕/升起等）；3）AI生成的视频关键帧序列。展示一张建筑效果图如何被\"激活\"成漫游动画。", "通栏，高度约8cm", "自行操作并截图"));
  c.push(emptyLine());

  c.push(heading4("2.2 文+图生成"));
  c.push(p("上传参考图的同时输入文字描述，让AI按照你的指令生成特定镜头运动："));
  c.push(codeBlock([
    "参考图：一张室内客厅效果图",
    "文字指令：镜头从门口缓缓推进到落地窗前，",
    "展示整个客厅空间，光线从窗外洒入，营造温馨氛围",
  ]));
  c.push(emptyLine());

  c.push(heading4("2.3 首尾帧生成"));
  c.push(p("上传首帧和尾帧两张图片，AI自动补全中间的过渡动画："));
  c.push(emptyLine());
  c.push(imageSlot("4-6", "首尾帧生成效果展示", "展示首尾帧生成的原理和效果：首帧（建筑正面远景）+ 尾帧（建筑入口近景）-> AI补全中间帧序列 -> 形成一段推进视频。上方展示首帧和尾帧，下方展示中间帧序列。", "通栏，高度约8cm", "自行在可灵AI中使用首尾帧功能并截图"));
  c.push(emptyLine());

  c.push(heading4("2.4 多图生成长视频"));
  c.push(p("将多张效果图按顺序组合，生成更长的展示视频："));
  c.push(codeBlock([
    "建议的建筑项目视频叙事顺序：",
    "1. 鸟瞰全景（项目整体）",
    "2. 建筑外观（主要建筑立面）",
    "3. 入口景观（从远到近）",
    "4. 室内大堂（从外到内过渡）",
    "5. 主要功能空间（2-3个）",
    "6. 景观细节（景观节点）",
    "7. 黄昏/夜景氛围（情感收尾）",
  ]));
  c.push(emptyLine());

  c.push(heading3("三、主流视频生成工具对比"));
  c.push(makeTable(
    ["工具", "核心优势", "视频时长", "建筑效果", "费用"],
    [
      ["可灵AI", "图生视频效果好，运镜自然", "5-10秒/段", "\u2605\u2605\u2605\u2605\u2605", "免费/付费"],
      ["即梦AI", "操作简单，集成在剪映生态", "4-6秒/段", "\u2605\u2605\u2605\u2605", "免费/付费"],
      ["Runway Gen-3", "专业级，功能全面", "5-10秒/段", "\u2605\u2605\u2605\u2605\u2605", "付费"],
      ["Pika", "风格化效果好", "3-4秒/段", "\u2605\u2605\u2605", "免费/付费"],
    ],
    [1500, 2500, 1800, 1500, 1726]
  ));
  c.push(emptyLine());

  // === 第17课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第17课时  高级视频生成"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "在掌握了基础的文生视频和图生视频后，本课时将学习更高级的视频生成技术：参照视频生成和数字人生成。这些技术可以让建筑方案的展示更加生动和专业。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、参照视频生成"));
  c.push(p("参照视频生成：上传一段参考视频，AI学习其中的镜头运动、节奏和风格，生成类似运动但内容不同的新视频。"));
  c.push(emptyLine());
  c.push(p([{ text: "建筑行业应用场景：", bold: true }]));
  c.push(bulletItem("参考一段专业建筑漫游视频的镜头运动，为你的项目生成类似质感的漫游"));
  c.push(bulletItem("参考一段房产宣传片的节奏和转场，快速制作类似的项目宣传视频"));
  c.push(bulletItem("参考一段景观四季变化视频，为你的景观项目生成四季效果"));
  c.push(emptyLine());
  c.push(imageSlot("4-7", "参照视频生成操作流程", "三栏：左-参考视频截图（专业建筑漫游）；中-操作界面（上传参考视频+输入新项目描述）；右-生成的新视频截图（保持类似镜头运动但内容为新项目）。", "通栏，高度约8cm", "自行操作并截图"));
  c.push(emptyLine());

  c.push(heading3("二、数字人生成"));
  c.push(p("数字人（Digital Human）技术可以生成虚拟讲解员，为建筑项目做专业介绍："));
  c.push(emptyLine());
  c.push(makeTable(
    ["应用场景", "说明", "效果"],
    [
      ["项目路演", "虚拟讲解员在效果图前介绍项目亮点", "节省真人拍摄成本"],
      ["楼盘展示", "虚拟置业顾问在样板间中讲解户型", "24小时不间断展示"],
      ["文旅宣传", "虚拟导游在景区效果图中讲解游览路线", "多语言切换"],
      ["教学演示", "虚拟教师讲解建筑知识", "可重复使用"],
    ],
    [2000, 4026, 3000]
  ));
  c.push(emptyLine());

  c.push(p([{ text: "常用数字人工具：", bold: true }]));
  c.push(bulletItemBold("HeyGen：", "国际主流，效果自然，支持中文"));
  c.push(bulletItemBold("硅基智能：", "国产，中文效果好，支持形象定制"));
  c.push(bulletItemBold("腾讯智影：", "腾讯出品，集成数字人和视频编辑"));
  c.push(emptyLine());

  c.push(imageSlot("4-8", "数字人介绍建筑项目效果展示", "展示一个数字人站在建筑效果图前做项目介绍的视频截图。标注数字人的自然度和可定制的外观、声音等参数。", "通栏，高度约8cm", "自行在数字人工具中制作一段建筑项目介绍并截图"));
  c.push(emptyLine());

  // === 第18课时 ===
  c.push(new Paragraph({ children: [new PageBreak()] }));
  c.push(heading2("第18课时  视频剪辑与整合"));
  c.push(emptyLine());
  c.push(tipBox("章节导读", "前面几个课时中，我们学会了生成配音、音乐、各类视频片段和数字人。本课时将学习如何把这些AI生成的素材整合剪辑成一部完整的建筑方案展示视频。这是本模块的综合实战环节。", "E67E22", "FEF5E7"));
  c.push(emptyLine());

  c.push(heading3("一、AI辅助视频剪辑工具"));
  c.push(makeTable(
    ["工具", "特点", "适合场景", "费用"],
    [
      ["剪映（字节跳动）", "操作简单，AI功能强大，模板丰富", "入门首选，日常使用", "免费/Pro"],
      ["必剪（B站）", "简单易用，适合短视频", "快速剪辑", "免费"],
      ["Premiere Pro", "专业级，功能全面", "高质量视频制作", "付费"],
      ["达芬奇", "调色强大，免费版功能完整", "专业后期", "免费/付费"],
    ],
    [2200, 2800, 2200, 1826]
  ));
  c.push(emptyLine());

  c.push(tipBox("教学建议", "推荐使用剪映作为主要剪辑工具，操作门槛低、AI功能丰富，且与即梦AI、豆包等工具同属字节跳动生态，素材互通方便。", "2E75B6", "EBF5FB"));
  c.push(emptyLine());

  c.push(heading3("二、完整方案展示视频制作流程"));
  c.push(emptyLine());
  c.push(imageSlot("4-9", "方案展示视频制作全流程图", "横向流程图：1）收集素材（AI效果图+AI视频片段+AI配音+AI音乐） -> 2）编写脚本（确定叙事结构和时间线） -> 3）导入剪辑（将素材拖入时间线） -> 4）添加转场（设置片段间过渡效果） -> 5）添加字幕（项目名称、功能说明等） -> 6）音画同步（配音对齐画面） -> 7）导出成片", "通栏，高度约5cm", "自行绘制流程图"));
  c.push(emptyLine());

  c.push(heading4("步骤1：编写视频脚本"));
  c.push(p("一个完整的建筑方案展示视频通常包含以下结构："));
  c.push(emptyLine());
  c.push(makeTable(
    ["段落", "内容", "时长建议", "画面"],
    [
      ["片头", "项目名称+设计理念关键词", "5-8秒", "文字动画+背景音乐"],
      ["项目概况", "地理位置、用地规模、设计条件", "15-20秒", "区位图+鸟瞰图+配音"],
      ["设计理念", "核心理念阐述", "15-20秒", "概念图+意向图+配音"],
      ["总体布局", "功能分区、交通组织", "15-20秒", "鸟瞰图漫游+分析图"],
      ["建筑/空间展示", "主要空间效果展示", "30-45秒", "效果图视频+室内漫游"],
      ["景观环境", "景观节点、绿化配置", "15-20秒", "景观效果图视频"],
      ["片尾", "项目愿景+设计团队", "5-8秒", "文字+音乐渐弱"],
    ],
    [1500, 2500, 1500, 3526]
  ));
  c.push(emptyLine());

  c.push(heading4("步骤2：素材整合与剪辑"));
  c.push(p("将以下AI生成的素材导入剪辑软件："));
  c.push(bulletItem("AI生成的效果图（模块三）-> 作为静态画面或制成图生视频"));
  c.push(bulletItem("AI生成的视频片段（本模块）-> 作为动态画面"));
  c.push(bulletItem("AI配音（第15课时）-> 放在音频轨道"));
  c.push(bulletItem("AI背景音乐（第15课时）-> 放在音乐轨道"));
  c.push(emptyLine());

  c.push(imageSlot("4-10", "剪映时间线编辑界面截图", "展示剪映中一个建筑方案视频项目的时间线截图，标注：1）视频轨道（多段AI视频片段）；2）图片轨道（效果图静帧）；3）文字轨道（字幕和标题）；4）配音轨道；5）音乐轨道。让学生直观理解多轨编辑。", "通栏，高度约8cm", "自行在剪映中制作一个示例项目并截图"));
  c.push(emptyLine());

  c.push(heading4("步骤3：添加字幕和转场"));
  c.push(p([{ text: "字幕类型：", bold: true }]));
  c.push(bulletItem("项目标题（大字号，设计感字体）"));
  c.push(bulletItem("功能说明（如\"首层平面\"\"客厅空间\"等分段标题）"));
  c.push(bulletItem("技术参数（面积、材料等关键数据）"));
  c.push(bulletItem("配音字幕（跟随旁白的实时字幕）"));
  c.push(emptyLine());

  c.push(p([{ text: "推荐转场效果：", bold: true }]));
  c.push(bulletItem("淡入淡出（最常用、最稳妥）"));
  c.push(bulletItem("叠化（两段画面柔和过渡）"));
  c.push(bulletItem("推拉（适合空间转换）"));
  c.push(emptyLine());
  c.push(tipBox("建议", "建筑方案视频的转场要简洁大方，避免花哨的特效转场。整体风格应保持专业、稳重。", "27AE60", "EAFAF1"));
  c.push(emptyLine());

  c.push(heading3("三、综合实操：制作一部建筑方案展示视频"));
  c.push(p([{ text: "实操任务：", bold: true, color: "2E75B6" }]));
  c.push(p("使用本模块学到的所有技术，制作一部1-2分钟的建筑方案展示视频。"));
  c.push(emptyLine());

  c.push(p([{ text: "素材清单：", bold: true }]));
  c.push(bulletItem("模块三综合实训中生成的效果图（至少5张）"));
  c.push(bulletItem("用效果图生成的AI视频片段（至少3段）"));
  c.push(bulletItem("AI配音旁白（根据脚本生成）"));
  c.push(bulletItem("AI背景音乐（1首）"));
  c.push(emptyLine());

  c.push(p([{ text: "评分标准：", bold: true }]));
  c.push(makeTable(
    ["评分维度", "占比", "说明"],
    [
      ["叙事结构", "20%", "视频是否有清晰的叙事逻辑和节奏"],
      ["视觉质量", "25%", "画面质量、效果图水平、视频片段效果"],
      ["音画配合", "20%", "配音与画面是否同步，音乐是否合适"],
      ["剪辑技术", "15%", "转场、字幕、节奏把控"],
      ["专业性", "10%", "建筑专业内容是否准确"],
      ["创意性", "10%", "是否有独特的创意和亮点"],
    ],
    [1800, 1000, 6226]
  ));
  c.push(emptyLine());

  // 实践课
  c.push(makeSep());
  c.push(heading2("实践课指导（4课时）"));
  c.push(emptyLine());

  c.push(heading3("实践五：音频生成实操（第1课时）"));
  c.push(p([{ text: "任务1（30分钟）：", bold: true }, { text: "用AI将一段300字的设计说明转为专业配音，尝试3种不同音色并对比效果。" }]));
  c.push(p([{ text: "任务2（30分钟）：", bold: true }, { text: "用Suno生成一首30秒的建筑项目背景音乐，尝试不同风格（轻柔/大气/中国风）。" }]));
  c.push(emptyLine());

  c.push(heading3("实践六：视频生成实操（第2课时）"));
  c.push(p([{ text: "任务1（30分钟）：", bold: true }, { text: "选择模块三中生成的3张效果图，分别用图生视频功能生成3段建筑漫游视频。" }]));
  c.push(p([{ text: "任务2（30分钟）：", bold: true }, { text: "使用首尾帧功能，制作一段从建筑外观到室内空间的推进过渡视频。" }]));
  c.push(emptyLine());

  c.push(heading3("实践七：视频剪辑整合实操（第3-4课时）"));
  c.push(p([{ text: "综合任务（2课时）：", bold: true }]));
  c.push(bulletItem("编写1-2分钟的方案展示视频脚本"));
  c.push(bulletItem("将所有AI生成素材导入剪映"));
  c.push(bulletItem("按脚本结构剪辑整合"));
  c.push(bulletItem("添加字幕、转场和背景音乐"));
  c.push(bulletItem("导出成片并提交"));
  c.push(bulletItem("课堂播放和互评"));
  c.push(emptyLine());

  // 本章小结
  c.push(makeSep());
  c.push(heading3("本章小结"));
  c.push(makeTable(
    ["知识点", "核心内容"],
    [
      ["文字转语音", "用AI为方案汇报生成专业配音"],
      ["双人播客", "NotebookLM将文档转为播客式音频"],
      ["AI音乐", "Suno等工具为项目生成匹配的背景音乐"],
      ["文生视频", "用文字描述直接生成建筑场景视频"],
      ["图生视频", "效果图转漫游动画（单图、文+图、首尾帧、多图）"],
      ["参照视频", "参考专业视频的运镜风格生成新内容"],
      ["数字人", "虚拟讲解员为建筑项目做专业介绍"],
      ["视频剪辑", "用剪映整合AI素材制作完整方案展示视频"],
    ],
    [2000, 7026]
  ));
  c.push(emptyLine());
  c.push(tipBox("下一模块预告", "模块五将学习用AI快速制作建筑方案汇报PPT，进一步完善方案展示的全套工具链。", "2E75B6", "EBF5FB"));
  c.push(emptyLine());

  c.push(imageSlot("4-11", "本章配套资源二维码", "包含两个二维码：1）\"扫码观看AI音视频生成教程\"；2）\"扫码查看学生优秀视频作品\"。", "半栏（居中），高度约5cm", "待小程序上线后生成二维码"));

  return c;
}

// ===== 组装并生成文档 =====
const allChildren = [
  // 封面
  ...[emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine()],
  p("建筑AIGC通用教程", { size: 56, bold: true, color: "1A5276", alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  p("Architecture AIGC General Tutorial", { size: 28, color: "5D6D7E", alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
  makeSep(),
  emptyLine(),
  p("模块三  图像生成 -- 建筑设计可视化", { size: 28, color: "2E75B6", alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
  p("模块四  音视频生成 -- 方案展示", { size: 28, color: "2E75B6", alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
  makeSep(),
  emptyLine(), emptyLine(),
  p("（征求意见稿）", { size: 24, color: "999999", alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildModule3(),
  ...buildModule4(),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Microsoft YaHei", color: "1A5276" }, paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Microsoft YaHei", color: "2E75B6" }, paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Microsoft YaHei", color: "2C3E50" }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }, { level: 1, format: LevelFormat.BULLET, text: "\u25CB", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } }] }] },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "建筑AIGC通用教程", font: "Microsoft YaHei", size: 18, color: "999999" })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "- ", font: "Microsoft YaHei", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Microsoft YaHei", size: 18, color: "999999" }), new TextRun({ text: " -", font: "Microsoft YaHei", size: 18, color: "999999" })] })] }) },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/ypw/Documents/token_net/textbook/建筑AIGC通用教程_模块三四.docx", buffer);
  console.log("Word document generated successfully!");
  console.log("File: /Users/ypw/Documents/token_net/textbook/建筑AIGC通用教程_模块三四.docx");
  console.log("Size:", (buffer.length / 1024).toFixed(1), "KB");
});
