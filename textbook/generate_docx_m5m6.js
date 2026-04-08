const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat
} = require("docx");

// ===== 辅助函数（与前文一致） =====
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
const imgBorder = { style: BorderStyle.SINGLE, size: 2, color: "E74C3C" };
const imgBorders = { top: imgBorder, bottom: imgBorder, left: imgBorder, right: imgBorder };
const PAGE_WIDTH = 11906, MARGIN_LEFT = 1440, MARGIN_RIGHT = 1440;
const CW = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const p = (text, o = {}) => {
  const runs = [];
  if (typeof text === "string") runs.push(new TextRun({ text, font: "Microsoft YaHei", size: o.size || 24, bold: o.bold, color: o.color }));
  else if (Array.isArray(text)) text.forEach(t => typeof t === "string" ? runs.push(new TextRun({ text: t, font: "Microsoft YaHei", size: o.size || 24 })) : runs.push(new TextRun({ text: t.text, font: "Microsoft YaHei", size: t.size || o.size || 24, bold: t.bold, color: t.color })));
  return new Paragraph({ children: runs, heading: o.heading, alignment: o.alignment, spacing: o.spacing || { after: 120 } });
};
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: "Microsoft YaHei", size: 36, bold: true, color: "1A5276" })], spacing: { before: 360, after: 240 } });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: "Microsoft YaHei", size: 32, bold: true, color: "2E75B6" })], spacing: { before: 300, after: 200 } });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: "Microsoft YaHei", size: 28, bold: true, color: "2C3E50" })], spacing: { before: 240, after: 160 } });
const h4 = t => new Paragraph({ children: [new TextRun({ text: t, font: "Microsoft YaHei", size: 26, bold: true, color: "34495E" })], spacing: { before: 200, after: 120 } });
const nl = () => p("", { size: 12 });
const sep = () => new Paragraph({ children: [], spacing: { before: 120, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } } });
const pb = () => new Paragraph({ children: [new PageBreak()] });

const tbl = (headers, rows, cw) => {
  const tr = [];
  tr.push(new TableRow({ children: headers.map((h, i) => new TableCell({ borders, width: { size: cw[i], type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: h, font: "Microsoft YaHei", size: 22, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })] })) }));
  rows.forEach((r, ri) => tr.push(new TableRow({ children: r.map((c, ci) => new TableCell({ borders, width: { size: cw[ci], type: WidthType.DXA }, shading: ri % 2 === 0 ? { fill: "F2F7FB", type: ShadingType.CLEAR } : undefined, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: String(c), font: "Microsoft YaHei", size: 22 })], spacing: { after: 40 } })] })) })));
  return new Table({ width: { size: cw.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: cw, rows: tr });
};

const img = (id, title, content, size, source) => new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], rows: [new TableRow({ children: [new TableCell({ borders: imgBorders, width: { size: CW, type: WidthType.DXA }, shading: { fill: "FDEDEC", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `[插图 ${id}]`, font: "Microsoft YaHei", size: 24, bold: true, color: "E74C3C" })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "图片标题：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: title, font: "Microsoft YaHei", size: 22 })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "建议内容：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: content, font: "Microsoft YaHei", size: 22 })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "建议尺寸：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: size, font: "Microsoft YaHei", size: 22 })] }),
  new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: "建议来源：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }), new TextRun({ text: source, font: "Microsoft YaHei", size: 22 })] }),
] })] })] });

const tip = (title, content, color = "27AE60", bg = "EAFAF1") => new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 2, color }, bottom: { style: BorderStyle.SINGLE, size: 2, color }, left: { style: BorderStyle.SINGLE, size: 6, color }, right: { style: BorderStyle.SINGLE, size: 2, color } }, width: { size: CW, type: WidthType.DXA }, shading: { fill: bg, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 150, right: 120 }, children: [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, font: "Microsoft YaHei", size: 22, bold: true, color })] }),
  new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: content, font: "Microsoft YaHei", size: 22 })] }),
] })] })] });

const code = lines => {
  const ch = lines.map(l => new Paragraph({ spacing: { after: 20 }, indent: { left: 200 }, children: [new TextRun({ text: l, font: "Consolas", size: 20, color: "2C3E50" })] }));
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, left: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, right: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" } }, width: { size: CW, type: WidthType.DXA }, shading: { fill: "F8F9FA", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 150, right: 120 }, children: ch })] })] });
};

const bi = (t, lv = 0) => new Paragraph({ numbering: { reference: "bullets", level: lv }, children: [new TextRun({ text: t, font: "Microsoft YaHei", size: 24 })], spacing: { after: 60 } });
const bib = (b, n, lv = 0) => new Paragraph({ numbering: { reference: "bullets", level: lv }, children: [new TextRun({ text: b, font: "Microsoft YaHei", size: 24, bold: true }), new TextRun({ text: n, font: "Microsoft YaHei", size: 24 })], spacing: { after: 60 } });

// =============== 模块五 ===============
function buildM5() {
  const c = [];
  c.push(h1("模块五  PPT与汇报制作"));
  c.push(nl());
  c.push(tip("模块信息", "课时安排：理论2课时 + 实践2课时\n教学目标：\n1. 掌握主流AI工具快速生成建筑方案汇报PPT的方法\n2. 能对比评估不同AI PPT工具的优劣，选择适合的工具\n3. 能对AI生成的PPT进行二次优化，达到专业汇报水准\n4. 了解用代码方式生成高质量PPT的进阶方法", "2E75B6", "EBF5FB"));
  c.push(nl());
  c.push(tip("课程思政融入点", "- 工匠精神：AI生成PPT只是起点，精心打磨才能出精品\n- 专业素养：建筑方案汇报的视觉表达是设计师核心能力之一\n- 创新意识：用AI工具突破传统PPT制作的效率瓶颈", "8E44AD", "F5EEF8"));
  c.push(nl());

  // === 第19课时 ===
  c.push(h2("第19课时  AI快速制作建筑方案PPT"));
  c.push(nl());
  c.push(tip("章节导读", "建筑方案汇报是设计工作中的关键环节。一份专业的PPT不仅要内容充实，更要视觉精美、逻辑清晰。传统方式制作一份方案汇报PPT往往需要1-2天，而借助AI工具，可以在30分钟内完成初稿，大幅提升效率。本课时将介绍四种主流AI PPT工具，教你快速生成专业级的建筑方案PPT。", "E67E22", "FEF5E7"));
  c.push(nl());

  c.push(h3("一、四大AI PPT工具对比"));
  c.push(nl());
  c.push(tbl(
    ["工具", "核心特点", "操作方式", "模板质量", "建筑适用度", "费用"],
    [
      ["WPS AI", "深度集成WPS办公套件，一键生成", "输入主题 -> 选择模板 -> 自动生成", "\u2605\u2605\u2605\u2605", "\u2605\u2605\u2605\u2605", "WPS会员"],
      ["Kimi", "大纲生成能力强，支持长文档分析", "上传资料 -> 生成大纲 -> 导出PPT", "\u2605\u2605\u2605", "\u2605\u2605\u2605\u2605", "免费/付费"],
      ["豆包", "AI对话式生成，修改灵活", "对话描述需求 -> 逐步完善 -> 导出", "\u2605\u2605\u2605\u2605", "\u2605\u2605\u2605", "免费/付费"],
      ["Cursor/IDE", "代码生成PPT，自定义程度最高", "用代码描述内容 -> 生成PPTX文件", "\u2605\u2605\u2605\u2605\u2605", "\u2605\u2605\u2605\u2605\u2605", "Cursor免费版可用"],
    ],
    [1200, 2200, 2200, 1100, 1100, 1226]
  ));
  c.push(nl());

  c.push(h3("二、WPS AI 生成PPT"));
  c.push(h4("2.1 操作步骤"));
  c.push(nl());
  c.push(img("5-1", "WPS AI生成PPT操作步骤", "分步截图教程（4-5步）：1）打开WPS演示，点击\"AI创建PPT\"；2）输入PPT主题（如\"某住宅小区建筑方案汇报\"）或上传设计方案文档；3）AI自动生成PPT大纲，可手动调整；4）选择模板风格；5）一键生成完整PPT。每步配界面截图和标注。", "通栏，高度约12cm", "自行在WPS中操作并截图"));
  c.push(nl());

  c.push(p([{ text: "建筑方案PPT的提示词示例：", bold: true, color: "2E75B6" }]));
  c.push(code([
    "请为以下建筑项目生成方案汇报PPT：",
    "",
    "项目名称：XX大学图书馆设计方案",
    "项目概况：位于校园中轴线北端，用地面积8000㎡，建筑面积25000㎡",
    "设计风格：现代简约，融入书院文化元素",
    "PPT结构：项目背景、设计理念、总体布局、建筑单体、室内设计、",
    "         景观设计、技术策略、经济指标",
    "风格要求：专业大气，深色背景，适合投影仪展示",
  ]));
  c.push(nl());

  c.push(h4("2.2 WPS AI的优势与局限"));
  c.push(tbl(
    ["维度", "优势", "局限"],
    [
      ["操作", "一键生成，门槛最低", "自定义空间有限"],
      ["模板", "商务模板丰富", "建筑行业专用模板较少"],
      ["内容", "文字内容生成质量好", "无法自动插入建筑效果图"],
      ["修改", "在WPS中直接编辑修改", "AI二次修改能力较弱"],
    ],
    [1500, 3763, 3763]
  ));
  c.push(nl());

  c.push(h3("三、Kimi 生成PPT"));
  c.push(p("Kimi的优势在于可以上传项目资料（设计说明书、任务书等），AI阅读理解后生成PPT："));
  c.push(nl());
  c.push(img("5-2", "Kimi生成建筑PPT操作流程", "分步截图：1）上传设计说明书PDF到Kimi对话；2）要求Kimi\"根据这份设计说明生成PPT大纲\"；3）Kimi输出结构化大纲；4）要求\"生成PPT文件\"或\"导出为PPT格式\"；5）下载生成的PPT文件。", "通栏，高度约10cm", "自行在Kimi中操作并截图"));
  c.push(nl());

  c.push(p([{ text: "Kimi提示词示例：", bold: true, color: "2E75B6" }]));
  c.push(code([
    "请根据我上传的设计说明书，生成一份方案汇报PPT。",
    "",
    "要求：",
    "1. 提取文档中的核心内容，不要遗漏重要信息",
    "2. PPT共15-20页",
    "3. 每页文字精简，突出关键数据和设计亮点",
    "4. 设计专业的排版建议（哪些页面适合放效果图）",
    "5. 在需要插入效果图的位置标注[此处插入XX效果图]",
  ]));
  c.push(nl());

  c.push(h3("四、豆包 AI生成PPT"));
  c.push(p("豆包的特色是对话式交互，可以通过多轮对话逐步完善PPT内容："));
  c.push(nl());
  c.push(img("5-3", "豆包AI生成PPT操作截图", "展示在豆包中通过对话方式生成PPT的过程：第1轮提出需求 -> 豆包生成初稿 -> 第2轮要求修改某页 -> 豆包更新 -> 最终导出。展示对话式优化的灵活性。", "通栏，高度约10cm", "自行在豆包中操作并截图"));
  c.push(nl());

  c.push(h3("五、四种工具综合对比与选择建议"));
  c.push(nl());
  c.push(tbl(
    ["使用场景", "推荐工具", "原因"],
    [
      ["快速生成初稿，赶时间", "WPS AI", "一键生成最快，模板即用"],
      ["有完整设计文档，需要提炼", "Kimi", "长文档理解能力强，提炼准确"],
      ["需要反复调整修改", "豆包", "对话式交互，修改灵活"],
      ["追求高质量定制效果", "Cursor/IDE", "完全自定义，质量最高（第20课时详解）"],
      ["日常教学和简单汇报", "WPS AI / 豆包", "简单快捷，满足基本需求"],
      ["重要方案评审和投标", "Cursor/IDE + 人工优化", "专业度最高"],
    ],
    [2500, 2200, 4326]
  ));
  c.push(nl());

  c.push(tip("教学建议", "建议学生至少掌握WPS AI和Kimi两种工具的使用方法，选择一种作为主力工具。对有编程兴趣的学生，可引导其学习Cursor生成PPT的方法。", "2E75B6", "EBF5FB"));
  c.push(nl());

  // === 第20课时 ===
  c.push(pb());
  c.push(h2("第20课时  专业汇报PPT实战"));
  c.push(nl());
  c.push(tip("章节导读", "上一课时我们学会了用AI快速生成PPT初稿。但AI生成的PPT往往存在排版粗糙、逻辑不够紧凑、缺少专业图片等问题。本课时将学习如何对AI生成的PPT进行专业优化，以及建筑行业PPT汇报的排版规范和审美标准。", "E67E22", "FEF5E7"));
  c.push(nl());

  c.push(h3("一、AI生成PPT的常见问题"));
  c.push(nl());
  c.push(tbl(
    ["常见问题", "表现", "优化方法"],
    [
      ["文字过多", "每页堆满文字，像Word文档", "精简为关键词+数据，详细内容用口头讲解"],
      ["排版单调", "每页都是标题+正文的固定版式", "交替使用全图页、对比页、数据页等多种版式"],
      ["缺少图片", "纯文字，没有效果图和分析图", "插入AI生成的效果图（模块三）"],
      ["配色不统一", "颜色混乱，不够专业", "统一使用2-3个主色调"],
      ["逻辑跳跃", "页面之间缺乏过渡", "添加过渡页和逻辑连接语"],
      ["字体不规范", "字体混用，大小不一", "标题/正文/注释各统一一种字体和大小"],
    ],
    [1800, 3000, 4226]
  ));
  c.push(nl());

  c.push(h3("二、建筑行业PPT排版规范"));
  c.push(h4("2.1 页面尺寸与基本设置"));
  c.push(bi("尺寸：推荐16:9宽屏（适合投影和屏幕展示）"));
  c.push(bi("背景：深色背景（深灰/深蓝/黑色）更适合建筑方案展示，效果图更突出"));
  c.push(bi("字体：标题用微软雅黑/思源黑体（粗体），正文用微软雅黑（常规）"));
  c.push(bi("字号：标题28-36pt，正文18-24pt，注释14-16pt"));
  c.push(nl());

  c.push(h4("2.2 建筑方案PPT常用页面版式"));
  c.push(nl());
  c.push(tbl(
    ["版式类型", "适用场景", "布局描述"],
    [
      ["封面页", "项目标题展示", "全屏效果图做背景，叠加半透明色块放标题"],
      ["目录页", "章节导航", "简洁列表或图标导航"],
      ["全图页", "效果图展示", "图片占满全页，底部叠加窄条标注"],
      ["图文对半页", "设计说明+效果图", "左图右文或上图下文"],
      ["对比页", "方案对比/前后对比", "左右或上下分栏对比"],
      ["数据页", "技术经济指标", "表格或图表为主"],
      ["时间线页", "项目进度/设计流程", "横向时间轴"],
      ["过渡页", "章节转换", "大字标题+简洁背景"],
      ["致谢页", "结尾", "简洁文字+联系方式"],
    ],
    [1800, 2200, 5026]
  ));
  c.push(nl());

  c.push(img("5-4", "建筑方案PPT九种版式示例", "3x3九宫格展示上述九种版式的示例页面。每格为一种版式的缩略图，标注版式名称。整体风格统一为深色背景建筑方案汇报风格。", "通栏，高度约12cm", "自行制作示例PPT页面并截图拼合，或用AI辅助生成各版式示例"));
  c.push(nl());

  c.push(h3("三、PPT二次优化实操"));
  c.push(p("以AI生成的PPT为基础，进行以下优化步骤："));
  c.push(nl());
  c.push(p([{ text: "步骤1：内容精简", bold: true }]));
  c.push(bi("删除冗余文字，每页保留3-5个要点"));
  c.push(bi("数据用图表替代文字描述"));
  c.push(bi("设计说明用关键词云替代长段文字"));
  c.push(nl());
  c.push(p([{ text: "步骤2：插入效果图", bold: true }]));
  c.push(bi("将模块三生成的AI效果图插入对应页面"));
  c.push(bi("效果图尽量做大，文字做小"));
  c.push(bi("建筑类PPT应\"以图为主，以文为辅\""));
  c.push(nl());
  c.push(p([{ text: "步骤3：统一视觉风格", bold: true }]));
  c.push(bi("确定主色调（推荐2-3个颜色）"));
  c.push(bi("统一字体、字号、行距"));
  c.push(bi("图片边框和阴影效果保持一致"));
  c.push(nl());
  c.push(p([{ text: "步骤4：添加过渡与动画", bold: true }]));
  c.push(bi("章节之间加过渡页"));
  c.push(bi("动画简洁克制（淡入为主，避免花哨效果）"));
  c.push(bi("效果图可用\"渐显\"动画增加展示感"));
  c.push(nl());

  c.push(img("5-5", "AI生成PPT优化前后对比", "左右对比两个版本：左-AI直接生成的原始PPT页面（文字多、排版单调）；右-经过优化后的专业版本（精简文字、插入效果图、统一风格）。用红色标注优化的关键改动点。展示3-4页的对比。", "通栏，高度约12cm", "自行制作优化前后对比截图"));
  c.push(nl());

  c.push(h3("四、用IDE代码生成精美PPT（进阶了解）"));
  c.push(p("对于追求极致效果的同学，可以用Cursor等AI编程工具生成PPT。原理是用代码精确控制每一页的布局、字体、颜色和图片位置："));
  c.push(nl());
  c.push(code([
    "操作流程：",
    "1. 打开Cursor编辑器",
    "2. 用自然语言描述PPT需求（例如：\"请用Python的pptx库",
    "   帮我创建一份建筑方案PPT，20页，深蓝色背景...\"）",
    "3. AI自动生成Python代码",
    "4. 运行代码 -> 自动生成.pptx文件",
    "5. 打开PPT检查并微调",
  ]));
  c.push(nl());
  c.push(tip("提示", "代码生成PPT的优势是：完全可定制、可批量生成、风格高度统一。但需要基本的编程环境。我们将在模块七\"AI辅助编程\"中更详细地学习这种方法。", "2E75B6", "EBF5FB"));
  c.push(nl());

  c.push(img("5-6", "Cursor代码生成PPT效果展示", "上下两栏：上-Cursor编辑器界面，左侧是AI对话指令，右侧是自动生成的Python代码；下-代码运行后生成的PPT效果截图（展示3-4页高质量建筑方案PPT）。", "通栏，高度约12cm", "自行在Cursor中操作并截图"));
  c.push(nl());

  // 实践课
  c.push(sep());
  c.push(h2("实践课指导（2课时）"));
  c.push(nl());
  c.push(h3("实践八：AI生成建筑方案PPT实操"));
  c.push(p([{ text: "实践目标：", bold: true }, { text: "独立完成一份建筑方案汇报PPT的AI生成、优化和展示" }]));
  c.push(nl());

  c.push(p([{ text: "任务（根据专业方向选做一项）：", bold: true }]));
  c.push(tbl(
    ["专业方向", "PPT选题", "页数要求"],
    [
      ["城乡规划", "某乡村振兴示范点规划方案汇报", "15-20页"],
      ["建筑设计", "某中学教学楼设计方案汇报", "15-20页"],
      ["室内设计", "某精品民宿室内设计方案汇报", "12-15页"],
      ["园林景观", "某社区公园景观设计方案汇报", "12-15页"],
    ],
    [1800, 4226, 3000]
  ));
  c.push(nl());

  c.push(p([{ text: "实践步骤：", bold: true }]));
  c.push(bi("步骤1（20分钟）：选择AI工具，输入提示词生成PPT初稿"));
  c.push(bi("步骤2（10分钟）：审核AI生成内容的准确性和逻辑性"));
  c.push(bi("步骤3（30分钟）：插入模块三生成的效果图，优化排版"));
  c.push(bi("步骤4（15分钟）：统一视觉风格，添加过渡页"));
  c.push(bi("步骤5（15分钟）：最终检查，导出并提交"));
  c.push(bi("步骤6（30分钟）：每组选1人做3分钟方案汇报展示 + 互评"));
  c.push(nl());

  c.push(p([{ text: "评分标准：", bold: true }]));
  c.push(tbl(
    ["评分维度", "占比", "说明"],
    [
      ["内容质量", "25%", "内容完整、逻辑清晰、专业准确"],
      ["视觉设计", "25%", "排版美观、配色统一、图片质量"],
      ["AI工具运用", "20%", "AI生成效率、提示词质量"],
      ["优化改进", "15%", "AI初稿与最终版的优化幅度"],
      ["汇报表达", "15%", "口头表达清晰、时间控制得当"],
    ],
    [1800, 1000, 6226]
  ));
  c.push(nl());

  // 本章小结
  c.push(sep());
  c.push(h3("本章小结"));
  c.push(tbl(
    ["知识点", "核心内容"],
    [
      ["AI PPT工具", "WPS AI（快速）、Kimi（文档提炼）、豆包（对话修改）、IDE（代码定制）"],
      ["工具选择", "根据场景选择：赶时间用WPS AI，追求质量用IDE代码方式"],
      ["排版规范", "16:9宽屏、深色背景、以图为主、文字精简"],
      ["版式设计", "九种常用版式：封面、目录、全图、图文、对比、数据等"],
      ["二次优化", "内容精简 -> 插入效果图 -> 统一风格 -> 添加过渡"],
      ["核心原则", "AI生成初稿只是起点，专业打磨才能出精品"],
    ],
    [2000, 7026]
  ));
  c.push(nl());
  c.push(img("5-7", "本章配套资源二维码", "两个二维码：1）\"扫码观看AI制作PPT视频教程\"；2）\"扫码下载建筑PPT模板\"。", "半栏（居中），高度约5cm", "待小程序上线后生成"));
  c.push(nl());

  return c;
}

// =============== 模块六 ===============
function buildM6() {
  const c = [];
  c.push(pb());
  c.push(h1("模块六  智能体与工作流"));
  c.push(nl());
  c.push(tip("模块信息", "课时安排：理论4课时 + 实践4课时\n教学目标：\n1. 理解AI知识库的概念，能搭建建筑规范知识库\n2. 理解AI工作流的概念，能设计和搭建简单的自动化工作流\n3. 能实现\"一句话生成视频\"的全自动工作流\n4. 能制作和发布建筑设计辅助智能体", "2E75B6", "EBF5FB"));
  c.push(nl());
  c.push(tip("课程思政融入点", "- 创新驱动：用AI工作流提升建筑行业的生产效率\n- 知识传承：用AI知识库实现建筑规范和经验的数字化传承\n- 协作共享：智能体的开放共享体现知识服务的公共价值", "8E44AD", "F5EEF8"));
  c.push(nl());

  // === 第21课时 ===
  c.push(h2("第21课时  知识库搭建"));
  c.push(nl());
  c.push(tip("章节导读", "在模块二中我们学过，AI有时会\"幻觉\" -- 编造不存在的规范条号或数据。解决这个问题的最有效方法之一就是搭建\"知识库\"：将可靠的专业资料上传给AI，让它基于这些资料回答问题，而不是凭\"记忆\"胡编。本课时将学习如何搭建建筑专业知识库，让AI成为你的\"规范查询助手\"。", "E67E22", "FEF5E7"));
  c.push(nl());

  c.push(h3("一、什么是AI知识库？"));
  c.push(p([{ text: "AI知识库（Knowledge Base）", bold: true }, { text: "：将你自己的文档资料上传给AI系统，AI在回答问题时会优先检索和引用这些资料，而不是仅依赖自身的训练数据。这种技术称为RAG（检索增强生成）。" }]));
  c.push(nl());

  c.push(img("6-1", "AI知识库工作原理示意图", "流程图：用户上传文档（PDF/Word/网页等）-> AI切分并存储为知识片段 -> 用户提问 -> AI从知识库中检索相关片段 -> 结合检索结果生成回答。标注\"RAG\"技术名称。对比两种模式：无知识库（AI可能幻觉）vs 有知识库（AI基于原文回答）。", "通栏，高度约8cm", "自行绘制流程图（PPT/Canva）"));
  c.push(nl());

  c.push(p([{ text: "知识库解决的核心问题：", bold: true }]));
  c.push(tbl(
    ["问题", "无知识库", "有知识库"],
    [
      ["规范查询", "AI可能编造条号和内容", "AI引用你上传的规范原文回答"],
      ["项目资料查找", "AI不了解你的项目", "AI检索项目文档给出准确信息"],
      ["经验知识沉淀", "团队经验存在个人脑中", "经验文档入库，新人随时查询"],
      ["信息时效性", "AI知识可能过时", "上传最新文件保持知识更新"],
    ],
    [2000, 3513, 3513]
  ));
  c.push(nl());

  c.push(h3("二、实操：搭建建筑规范知识库"));
  c.push(p("以Coze（扣子）平台为例，搭建一个建筑设计规范查询知识库："));
  c.push(nl());

  c.push(img("6-2", "Coze平台搭建知识库操作步骤", "分步截图教程（6步）：1）登录Coze（coze.cn）并创建新的Bot；2）进入\"知识库\"设置；3）点击\"上传文档\"，上传《建筑设计防火规范》PDF；4）设置分段规则（按章节自动分段）；5）等待AI处理完成（索引建立）；6）在对话中测试：输入\"住宅建筑的疏散楼梯有什么要求？\"，AI引用规范原文回答。", "通栏，高度约14cm", "自行在Coze平台操作并截图"));
  c.push(nl());

  c.push(p([{ text: "推荐上传的建筑规范文档：", bold: true }]));
  c.push(bi("《建筑设计防火规范》GB50016-2014（2018年版）"));
  c.push(bi("《民用建筑设计统一标准》GB50352-2019"));
  c.push(bi("《住宅设计规范》GB50096-2011"));
  c.push(bi("《城市居住区规划设计标准》GB50180-2018"));
  c.push(bi("《建筑内部装修设计防火规范》GB50222-2017"));
  c.push(nl());

  c.push(tip("注意", "上传规范文档仅用于个人学习和查询，请注意版权合规。建议上传正版购买的规范电子版。知识库中的规范解读仍需与纸质原文核对确认。", "E74C3C", "FDEDEC"));
  c.push(nl());

  c.push(h3("三、实操：创建项目资料知识库"));
  c.push(p("除了规范查询，知识库还可以用于管理项目资料："));
  c.push(nl());
  c.push(tbl(
    ["上传内容", "应用场景", "查询示例"],
    [
      ["设计任务书", "快速检索设计条件", "\"本项目的容积率要求是多少？\""],
      ["会议纪要", "追溯设计决策过程", "\"上次业主会议对外立面有什么意见？\""],
      ["材料手册", "查询材料参数", "\"XX品牌瓷砖的规格和价格是多少？\""],
      ["施工规范", "查询工艺要求", "\"外墙保温施工的质量验收标准？\""],
      ["竣工资料", "运维查询", "\"3号楼消防系统的设计参数？\""],
    ],
    [2000, 3013, 4013]
  ));
  c.push(nl());

  c.push(h3("四、知识库平台对比"));
  c.push(tbl(
    ["平台", "特点", "免费额度", "推荐场景"],
    [
      ["Coze/扣子", "字节跳动出品，功能全面，可发布为Bot", "有免费额度", "综合首选"],
      ["Dify", "开源平台，可本地部署，隐私性好", "开源免费", "注重数据隐私"],
      ["FastGPT", "国产开源，专注知识库问答", "社区版免费", "简单知识库"],
      ["Kimi", "直接在对话中上传文件作为知识库", "免费", "个人快速使用"],
    ],
    [1800, 2800, 1800, 2626]
  ));
  c.push(nl());

  // === 第22课时 ===
  c.push(pb());
  c.push(h2("第22课时  工作流设计"));
  c.push(nl());
  c.push(tip("章节导读", "知识库让AI能够准确回答问题，而\"工作流\"则让AI能够自动完成一系列复杂任务。想象一下：你输入一段项目需求描述，AI自动帮你生成设计说明 -> 生成效果图 -> 制作PPT -> 一步到位。这就是AI工作流的威力。本课时将学习工作流的基本概念和搭建方法。", "E67E22", "FEF5E7"));
  c.push(nl());

  c.push(h3("一、什么是AI工作流？"));
  c.push(p([{ text: "AI工作流（Workflow）", bold: true }, { text: "：将多个AI操作步骤按照设定的逻辑顺序串联起来，实现一个输入触发多步自动化执行。就像工厂的生产线：原材料从一端输入，经过一道道工序，最终从另一端输出成品。" }]));
  c.push(nl());

  c.push(img("6-3", "AI工作流概念示意图", "生产线比喻图：左侧\"输入\"（用户需求描述）-> 工序1（AI文字生成）-> 工序2（AI图像生成）-> 工序3（AI PPT生成）-> 右侧\"输出\"（完整方案汇报材料）。每道工序用不同颜色的方块表示，之间用传送带/箭头连接。", "通栏，高度约6cm", "自行绘制流程图"));
  c.push(nl());

  c.push(p([{ text: "工作流 vs 单次对话的区别：", bold: true }]));
  c.push(tbl(
    ["维度", "单次AI对话", "AI工作流"],
    [
      ["操作方式", "每次手动输入一个指令", "一次输入，自动执行多步"],
      ["任务复杂度", "适合单一任务", "适合复杂的多步骤任务"],
      ["效率", "需要人工在多个工具间切换", "一键触发，全自动执行"],
      ["可复用性", "每次都要重新输入", "搭建一次，反复使用"],
      ["举例", "\"帮我写一份设计说明\"", "输入需求 -> 自动生成文字+图片+PPT"],
    ],
    [2000, 3513, 3513]
  ));
  c.push(nl());

  c.push(h3("二、实操：搭建\"设计说明自动生成\"工作流"));
  c.push(p("以Coze平台为例，搭建一个输入项目基本信息就能自动生成完整设计说明的工作流："));
  c.push(nl());

  c.push(img("6-4", "Coze工作流搭建界面截图", "展示Coze的工作流编辑界面截图：左侧为节点列表，中间为画布（展示连接的各个节点），右侧为节点参数设置。标注关键元素：1）输入节点 2）大模型节点 3）条件分支 4）输出节点。", "通栏，高度约10cm", "自行在Coze中搭建工作流并截图"));
  c.push(nl());

  c.push(p([{ text: "工作流设计：", bold: true, color: "2E75B6" }]));
  c.push(code([
    "【输入节点】",
    "用户填写：项目名称、地点、面积、风格、功能需求",
    "",
    "   |",
    "   v",
    "",
    "【节点1：生成设计理念】",
    "提示词：根据以下项目信息，撰写设计理念（300字）...",
    "",
    "   |",
    "   v",
    "",
    "【节点2：生成空间布局说明】",
    "提示词：基于上述设计理念，撰写空间布局说明（500字）...",
    "",
    "   |",
    "   v",
    "",
    "【节点3：生成材料选型建议】",
    "提示词：根据项目风格，推荐材料选型方案...",
    "",
    "   |",
    "   v",
    "",
    "【输出节点】",
    "整合各节点内容 -> 输出完整设计说明书",
  ]));
  c.push(nl());

  c.push(h3("三、实操：搭建\"方案汇报一键生成\"工作流"));
  c.push(p("更进阶的工作流可以串联文字、图像和PPT生成："));
  c.push(nl());
  c.push(code([
    "输入：项目需求描述（一段话）",
    "   |",
    "   v",
    "步骤1：AI提取关键信息（项目名称、面积、风格等）",
    "   |",
    "   v",
    "步骤2：AI生成设计说明书（文字）",
    "   |",
    "   v",
    "步骤3：AI根据设计说明生成3张效果图（图像）",
    "   |",
    "   v",
    "步骤4：AI将文字+图片整合生成PPT（文档）",
    "   |",
    "   v",
    "输出：完整的方案汇报PPT + 设计说明书",
  ]));
  c.push(nl());

  c.push(img("6-5", "方案汇报一键生成工作流完整流程", "完整的工作流节点连接图：输入框 -> 信息提取节点 -> 文字生成节点 -> 图像生成节点（并行3张）-> PPT整合节点 -> 输出。每个节点用不同颜色的圆角矩形表示，展示数据在节点间的流动方向。", "通栏，高度约8cm", "自行在Coze中搭建完整工作流并截图，或用PPT绘制流程图"));
  c.push(nl());

  c.push(tip("教学建议", "工作流搭建是一个需要反复调试的过程。建议先搭建简单的2-3个节点的工作流（如步骤1-2），验证成功后再逐步增加节点。每增加一个节点都要测试一次。", "2E75B6", "EBF5FB"));
  c.push(nl());

  // === 第23课时 ===
  c.push(pb());
  c.push(h2("第23课时  一句话生成视频工作流"));
  c.push(nl());
  c.push(tip("章节导读", "本课时将挑战一个令人兴奋的目标：搭建一个\"一句话生成建筑宣传视频\"的全自动工作流。你只需输入一句话描述项目，AI就能自动完成从文案撰写到视频成片的全部流程。这是AI工作流在建筑行业最具展示性的应用之一。", "E67E22", "FEF5E7"));
  c.push(nl());

  c.push(h3("一、全流程原理"));
  c.push(nl());
  c.push(img("6-6", "一句话生成视频工作流全流程图", "从左到右的完整流程：一句话输入 -> 脚本生成（AI写分镜脚本）-> 画面生成（AI为每个分镜生成效果图）-> 视频生成（效果图转视频片段）-> 配音生成（AI生成旁白配音）-> 音乐生成（AI生成背景音乐）-> 自动剪辑（拼合所有素材）-> 输出成片。每个步骤用图标和简要文字说明。", "通栏，高度约6cm", "自行绘制流程图"));
  c.push(nl());

  c.push(p([{ text: "七步全自动流程：", bold: true }]));
  c.push(tbl(
    ["步骤", "AI操作", "输入", "输出"],
    [
      ["1. 脚本生成", "大语言模型（DeepSeek/GPT）", "一句话项目描述", "5-7段分镜脚本"],
      ["2. 画面生成", "图像生成（即梦/可灵）", "每段分镜的画面描述", "5-7张效果图"],
      ["3. 视频生成", "图生视频（可灵）", "每张效果图", "5-7段视频片段"],
      ["4. 配音生成", "文字转语音（豆包）", "每段分镜的旁白文字", "配音音频"],
      ["5. 音乐生成", "AI音乐（Suno）", "音乐风格描述", "背景音乐"],
      ["6. 自动剪辑", "视频拼合", "所有素材", "完整视频"],
      ["7. 输出成片", "导出", "--", "1-2分钟宣传视频"],
    ],
    [1500, 2200, 2300, 3026]
  ));
  c.push(nl());

  c.push(h3("二、实操演示"));
  c.push(p([{ text: "输入示例：", bold: true, color: "2E75B6" }]));
  c.push(code([
    "请为以下建筑项目生成一段60秒的宣传视频：",
    "\"江西省某县城新中式风格精品民宿，坐落在青山绿水之间，",
    "  融合了当地传统建筑元素和现代舒适体验。\"",
  ]));
  c.push(nl());

  c.push(p([{ text: "AI自动生成的分镜脚本示例：", bold: true }]));
  c.push(tbl(
    ["分镜", "画面描述", "时长", "旁白"],
    [
      ["1", "航拍青山绿水中的民宿建筑群全景", "8秒", "在江西的青山绿水间，藏着一处诗意栖居..."],
      ["2", "推进到民宿入口，新中式门楼和景墙", "8秒", "传统建筑的韵味，现代设计的精致..."],
      ["3", "穿过庭院，展示中央水景和古树", "8秒", "一步一景，处处是画..."],
      ["4", "进入客房，展示室内空间和窗外山景", "10秒", "推窗见山，枕水而眠..."],
      ["5", "露台茶室，茶具特写和远山日落", "8秒", "一盏清茶，看尽山色..."],
      ["6", "夜景全景，灯光映射在水面", "8秒", "夜幕降临，灯火阑珊..."],
      ["7", "项目LOGO和联系方式", "5秒", "XX民宿，期待与您相遇"],
    ],
    [800, 3200, 900, 4126]
  ));
  c.push(nl());

  c.push(img("6-7", "一句话生成视频效果展示", "展示上述分镜的最终效果：7个分镜画面按顺序排列（2行布局），每个画面下方标注分镜编号和旁白摘要。最后标注\"以上全部由AI自动生成\"。", "通栏，高度约10cm", "自行使用AI生成7个分镜的效果图拼合"));
  c.push(nl());

  c.push(h3("三、搭建平台介绍"));
  c.push(tbl(
    ["平台", "特点", "搭建难度", "推荐度"],
    [
      ["Coze/扣子", "节点可视化编辑，内置多种AI插件", "中等", "\u2605\u2605\u2605\u2605\u2605"],
      ["Dify", "开源，可自定义模型和工具", "较高", "\u2605\u2605\u2605\u2605"],
      ["百度千帆", "百度生态，中文支持好", "中等", "\u2605\u2605\u2605"],
    ],
    [1800, 3200, 1500, 2526]
  ));
  c.push(nl());

  c.push(tip("实际操作提示", "完整的\"一句话生成视频\"工作流搭建需要较多调试时间。在课堂上建议先演示已搭建好的工作流效果，让学生理解原理和流程。实际搭建可在课后或实践课中完成。也可以将步骤拆分，让学生手动完成各步骤，体验全流程。", "2E75B6", "EBF5FB"));
  c.push(nl());

  // === 第24课时 ===
  c.push(pb());
  c.push(h2("第24课时  智能体进阶应用"));
  c.push(nl());
  c.push(tip("章节导读", "前三课时我们学习了知识库、工作流和视频工作流。本课时将把这些技术整合起来，学习制作一个完整的\"建筑设计辅助智能体\"，并发布到平台供他人使用。智能体是知识库+工作流+对话能力的综合体，是AIGC应用的高级形态。", "E67E22", "FEF5E7"));
  c.push(nl());

  c.push(h3("一、什么是AI智能体？"));
  c.push(p([{ text: "AI智能体（AI Agent）", bold: true }, { text: "：一个具有特定知识、特定能力、特定身份的AI助手。它结合了大语言模型的对话能力、知识库的专业知识和工作流的自动化能力，可以像一个\"虚拟专家\"一样提供服务。" }]));
  c.push(nl());

  c.push(p([{ text: "智能体 = 大模型（大脑）+ 知识库（知识）+ 工作流（技能）+ 人设（身份）", bold: true, color: "2E75B6" }]));
  c.push(nl());

  c.push(img("6-8", "AI智能体组成要素图", "中心一个\"智能体\"图标，四周连接四个要素：1）大模型（大脑图标）- 提供理解和生成能力；2）知识库（书籍图标）- 提供专业知识；3）工作流（齿轮图标）- 提供自动化能力；4）人设（面具图标）- 定义身份和回答风格。", "半栏（居中），高度约8cm", "自行绘制信息图"));
  c.push(nl());

  c.push(h3("二、实操：制作建筑设计辅助智能体"));
  c.push(p("以Coze平台为例，制作一个\"建筑规范智能助手\"："));
  c.push(nl());

  c.push(p([{ text: "步骤1：设定人设", bold: true }]));
  c.push(code([
    "你是一位经验丰富的建筑设计规范顾问，名叫\"建规小助手\"。",
    "你的任务是帮助建筑设计师和学生查询和理解建筑设计规范。",
    "",
    "你的特点：",
    "- 回答时总是引用具体的规范条文编号和原文",
    "- 用通俗易懂的语言解释复杂的规范要求",
    "- 对不确定的内容会主动标注[待核实]",
    "- 回答后会提醒用户核实原文",
    "- 语气专业但友善，像一位耐心的前辈",
  ]));
  c.push(nl());

  c.push(p([{ text: "步骤2：挂载知识库", bold: true }]));
  c.push(bi("上传《建筑设计防火规范》《住宅设计规范》等核心规范"));
  c.push(bi("设置检索参数：每次检索返回最相关的3-5个知识片段"));
  c.push(nl());

  c.push(p([{ text: "步骤3：配置工作流（可选）", bold: true }]));
  c.push(bi("添加\"规范对比\"工作流：输入两条规范条文，自动对比分析差异"));
  c.push(bi("添加\"设计审查\"工作流：输入设计方案参数，自动检查是否符合规范"));
  c.push(nl());

  c.push(p([{ text: "步骤4：测试与优化", bold: true }]));
  c.push(bi("测试各类问题的回答质量"));
  c.push(bi("调整人设提示词和知识库检索参数"));
  c.push(bi("添加常见问题的预设回答"));
  c.push(nl());

  c.push(img("6-9", "Coze智能体配置界面截图", "展示Coze创建Bot的完整配置界面：1）Bot名称和头像设置；2）人设/系统提示词编辑区；3）知识库关联设置；4）工作流关联设置；5）开场白设置；6）预览对话测试。", "通栏，高度约12cm", "自行在Coze中配置智能体并截图"));
  c.push(nl());

  c.push(h3("三、智能体发布与分享"));
  c.push(p("在Coze平台，智能体可以发布到多个渠道："));
  c.push(nl());
  c.push(tbl(
    ["发布渠道", "说明", "适用场景"],
    [
      ["Coze商店", "发布到Coze平台的Bot商店", "开放给所有Coze用户使用"],
      ["网页嵌入", "生成嵌入代码，放入网站/小程序", "集成到自有平台"],
      ["微信公众号", "绑定公众号，在对话中使用", "方便微信用户"],
      ["飞书", "发布为飞书机器人", "企业/学校内部使用"],
      ["API接口", "通过API调用智能体", "集成到自有系统"],
    ],
    [2000, 3526, 3500]
  ));
  c.push(nl());

  c.push(img("6-10", "智能体发布渠道设置截图", "展示Coze的发布设置界面，标注各个发布渠道的入口和操作按钮。重点展示\"网页嵌入\"和\"微信公众号\"两个最常用的发布方式。", "通栏，高度约8cm", "自行在Coze中截图"));
  c.push(nl());

  c.push(h3("四、建筑行业智能体创意方向"));
  c.push(p("除了规范查询助手，以下是一些建筑行业智能体的创意方向："));
  c.push(nl());
  c.push(tbl(
    ["智能体名称", "功能描述", "知识库内容", "目标用户"],
    [
      ["\"户型小管家\"", "根据家庭人口和需求推荐户型方案", "户型库、设计规范", "购房者"],
      ["\"装修风格顾问\"", "对话式了解偏好，推荐装修风格和材料", "风格案例库、材料库", "业主"],
      ["\"造价速算器\"", "输入面积和标准，快速估算工程造价", "造价定额、指标库", "项目经理"],
      ["\"绿建评分助手\"", "评估建筑是否满足绿色建筑评价标准", "绿建评价标准", "设计师"],
      ["\"工地安全员\"", "识别施工现场安全隐患并给出建议", "安全规范、事故案例", "施工人员"],
      ["\"样式雷文化导览\"", "介绍样式雷历史和建筑文化知识", "样式雷研究资料", "文化爱好者"],
    ],
    [1800, 2500, 2200, 2526]
  ));
  c.push(nl());

  c.push(tip("课程思政", "\"样式雷文化导览\"智能体是一个很好的课程思政实践 -- 用AI技术传播中国建筑文化遗产。作为\"样式雷\"研究协会承办方的师生，你们有独特的资源优势来制作这个智能体，让更多人了解中国建筑文化的辉煌历史。", "8E44AD", "F5EEF8"));
  c.push(nl());

  // 实践课
  c.push(sep());
  c.push(h2("实践课指导（4课时）"));
  c.push(nl());

  c.push(h3("实践九：知识库搭建实操（第1课时）"));
  c.push(p([{ text: "任务：", bold: true }, { text: "在Coze平台搭建一个建筑规范知识库，并测试至少10个问题的回答效果。" }]));
  c.push(nl());
  c.push(bi("准备1-2份建筑规范PDF文件"));
  c.push(bi("上传到Coze创建知识库"));
  c.push(bi("设计10个测试问题（涵盖不同规范的不同章节）"));
  c.push(bi("对比有知识库和无知识库时AI回答的差异"));
  c.push(bi("记录测试结果并分析知识库的准确率"));
  c.push(nl());

  c.push(h3("实践十：工作流搭建实操（第2课时）"));
  c.push(p([{ text: "任务：", bold: true }, { text: "搭建一个\"输入项目信息 -> 自动生成设计说明\"的简单工作流。" }]));
  c.push(nl());
  c.push(bi("在Coze中创建新工作流"));
  c.push(bi("设置输入节点（项目名称、面积、风格等字段）"));
  c.push(bi("添加2-3个大模型节点（分别生成设计理念、空间布局、材料选型）"));
  c.push(bi("设置输出节点整合所有内容"));
  c.push(bi("测试工作流并优化提示词"));
  c.push(nl());

  c.push(h3("实践十一：智能体制作与发布（第3-4课时）"));
  c.push(p([{ text: "综合任务：", bold: true }, { text: "制作并发布一个建筑行业智能体。" }]));
  c.push(nl());

  c.push(p([{ text: "任务选项（选做一项）：", bold: true }]));
  c.push(tbl(
    ["选项", "智能体", "核心功能"],
    [
      ["A", "建筑规范查询助手", "上传规范 + 知识库问答"],
      ["B", "室内风格推荐顾问", "对话了解偏好 + 推荐风格"],
      ["C", "项目方案生成助手", "输入需求 + 工作流生成方案文本"],
      ["D（推荐）", "样式雷文化导览", "上传样式雷资料 + 文化知识问答"],
    ],
    [1000, 2500, 5526]
  ));
  c.push(nl());

  c.push(p([{ text: "评分标准：", bold: true }]));
  c.push(tbl(
    ["评分维度", "占比", "说明"],
    [
      ["功能完整性", "25%", "知识库/工作流是否正常工作"],
      ["回答质量", "25%", "智能体回答是否准确、专业、有用"],
      ["用户体验", "20%", "开场白、引导语、交互是否友好"],
      ["创意性", "15%", "智能体定位是否有创意和实用价值"],
      ["发布与分享", "15%", "是否成功发布并能分享给他人使用"],
    ],
    [1800, 1000, 6226]
  ));
  c.push(nl());

  // 本章小结
  c.push(sep());
  c.push(h3("本章小结"));
  c.push(tbl(
    ["知识点", "核心内容"],
    [
      ["AI知识库", "上传文档构建专业知识库（RAG），解决AI幻觉问题"],
      ["知识库应用", "规范查询助手、项目资料管理、经验知识沉淀"],
      ["AI工作流", "将多个AI步骤串联，实现一键触发自动化执行"],
      ["工作流应用", "设计说明自动生成、方案汇报一键生成"],
      ["一句话生成视频", "七步全自动流程：脚本->画面->视频->配音->音乐->剪辑->成片"],
      ["AI智能体", "大模型+知识库+工作流+人设的综合体"],
      ["智能体发布", "发布到Coze商店、网页、微信公众号等多渠道"],
    ],
    [2500, 6526]
  ));
  c.push(nl());

  c.push(tip("下一模块预告", "模块七将学习AI辅助编程 -- 用Cursor、Claude Code和OpenClaw等工具，让不懂代码的建筑专业学生也能\"一句话做网页\"\"一句话做小程序\"。", "2E75B6", "EBF5FB"));
  c.push(nl());

  c.push(img("6-11", "本章配套资源二维码", "两个二维码：1）\"扫码体验建筑规范查询智能体\"；2）\"扫码观看工作流搭建视频教程\"。", "半栏（居中），高度约5cm", "待小程序和智能体上线后生成"));
  c.push(nl());

  return c;
}

// ===== 组装生成文档 =====
const allChildren = [
  nl(), nl(), nl(), nl(), nl(),
  p("建筑AIGC通用教程", { size: 56, bold: true, color: "1A5276", alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  p("Architecture AIGC General Tutorial", { size: 28, color: "5D6D7E", alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
  sep(), nl(),
  p("模块五  PPT与汇报制作", { size: 28, color: "2E75B6", alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
  p("模块六  智能体与工作流", { size: 28, color: "2E75B6", alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
  sep(), nl(), nl(),
  p("（征求意见稿）", { size: 24, color: "999999", alignment: AlignmentType.CENTER }),
  pb(),
  ...buildM5(),
  ...buildM6(),
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
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "建筑AIGC通用教程", font: "Microsoft YaHei", size: 18, color: "999999" })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "- ", font: "Microsoft YaHei", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Microsoft YaHei", size: 18, color: "999999" }), new TextRun({ text: " -", font: "Microsoft YaHei", size: 18, color: "999999" })] })] }) },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/ypw/Documents/token_net/textbook/建筑AIGC通用教程_模块五六.docx", buffer);
  console.log("Done! File: 建筑AIGC通用教程_模块五六.docx, Size:", (buffer.length / 1024).toFixed(1), "KB");
});
