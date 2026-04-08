const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TabStopType, TabStopPosition
} = require("docx");

// ===== 样式和辅助函数 =====
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

// 图片占位框的边框和样式
const imgBorder = { style: BorderStyle.SINGLE, size: 2, color: "E74C3C" };
const imgBorders = { top: imgBorder, bottom: imgBorder, left: imgBorder, right: imgBorder };

// 页面常量 (A4)
const PAGE_WIDTH = 11906;
const MARGIN_LEFT = 1440;
const MARGIN_RIGHT = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 9026

function p(text, options = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, font: "Microsoft YaHei", size: options.size || 24, bold: options.bold, italics: options.italics, color: options.color }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") {
        runs.push(new TextRun({ text: t, font: "Microsoft YaHei", size: options.size || 24 }));
      } else {
        runs.push(new TextRun({ text: t.text, font: "Microsoft YaHei", size: t.size || options.size || 24, bold: t.bold, italics: t.italics, color: t.color, underline: t.underline }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    heading: options.heading,
    alignment: options.alignment,
    spacing: options.spacing || { after: 120 },
    indent: options.indent,
    ...(options.pageBreakBefore ? { pageBreakBefore: true } : {}),
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 36, bold: true, color: "1A5276" })],
    spacing: { before: 360, after: 240 },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 32, bold: true, color: "2E75B6" })],
    spacing: { before: 300, after: 200 },
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 28, bold: true, color: "2C3E50" })],
    spacing: { before: 240, after: 160 },
  });
}

function heading4(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 26, bold: true, color: "34495E" })],
    spacing: { before: 200, after: 120 },
  });
}

function emptyLine() {
  return p("", { size: 12 });
}

function makeSep() {
  return new Paragraph({
    children: [],
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
  });
}

// 简单表格
function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const tableRows = [];
  // Header row
  tableRows.push(new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders, width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: h, font: "Microsoft YaHei", size: 22, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
    })),
  }));
  // Data rows
  rows.forEach((row, ri) => {
    tableRows.push(new TableRow({
      children: row.map((cell, ci) => new TableCell({
        borders, width: { size: colWidths[ci], type: WidthType.DXA },
        shading: ri % 2 === 0 ? { fill: "F2F7FB", type: ShadingType.CLEAR } : undefined,
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: String(cell), font: "Microsoft YaHei", size: 22 })], spacing: { after: 40 } })],
      })),
    }));
  });
  return new Table({ width: { size: totalW, type: WidthType.DXA }, columnWidths: colWidths, rows: tableRows });
}

// 图片占位标注框
function imageSlot(id, title, content, size, source) {
  const slotRows = [
    new TableRow({
      children: [new TableCell({
        borders: imgBorders,
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        shading: { fill: "FDEDEC", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
            new TextRun({ text: `[插图 ${id}]`, font: "Microsoft YaHei", size: 24, bold: true, color: "E74C3C" }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: "图片标题：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }),
            new TextRun({ text: title, font: "Microsoft YaHei", size: 22 }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: "建议内容：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }),
            new TextRun({ text: content, font: "Microsoft YaHei", size: 22 }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: "建议尺寸：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }),
            new TextRun({ text: size, font: "Microsoft YaHei", size: 22 }),
          ]}),
          new Paragraph({ spacing: { after: 20 }, children: [
            new TextRun({ text: "建议来源：", font: "Microsoft YaHei", size: 22, bold: true, color: "C0392B" }),
            new TextRun({ text: source, font: "Microsoft YaHei", size: 22 }),
          ]}),
        ],
      })],
    }),
  ];
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH], rows: slotRows });
}

// 提示/注意框
function tipBox(title, content, color = "27AE60", bgColor = "EAFAF1") {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 2, color }, bottom: { style: BorderStyle.SINGLE, size: 2, color }, left: { style: BorderStyle.SINGLE, size: 6, color }, right: { style: BorderStyle.SINGLE, size: 2, color } },
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 120 },
        children: [
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, font: "Microsoft YaHei", size: 22, bold: true, color })] }),
          new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: content, font: "Microsoft YaHei", size: 22 })] }),
        ],
      })],
    })],
  });
}

// 代码块样式
function codeBlock(lines) {
  const children = lines.map(line =>
    new Paragraph({
      spacing: { after: 20 },
      indent: { left: 200 },
      children: [new TextRun({ text: line, font: "Consolas", size: 20, color: "2C3E50" })],
    })
  );
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, left: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }, right: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" } },
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        shading: { fill: "F8F9FA", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 120 },
        children,
      })],
    })],
  });
}

// 项目符号段落
function bulletItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 24 })],
    spacing: { after: 60 },
  });
}

function bulletItemBold(boldText, normalText, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [
      new TextRun({ text: boldText, font: "Microsoft YaHei", size: 24, bold: true }),
      new TextRun({ text: normalText, font: "Microsoft YaHei", size: 24 }),
    ],
    spacing: { after: 60 },
  });
}

// ===== 构建文档 =====
function buildDocument() {
  const children = [];

  // ========== 封面 ==========
  children.push(emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine());
  children.push(p("建筑AIGC通用教程", { size: 56, bold: true, color: "1A5276", alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
  children.push(p("Architecture AIGC General Tutorial", { size: 28, color: "5D6D7E", alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
  children.push(makeSep());
  children.push(emptyLine());
  children.push(p("模块一  AIGC概要与建筑行业应用", { size: 28, color: "2E75B6", alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
  children.push(p("模块二  文字生成 -- 建筑文本写作", { size: 28, color: "2E75B6", alignment: AlignmentType.CENTER, spacing: { after: 300 } }));
  children.push(makeSep());
  children.push(emptyLine(), emptyLine());
  children.push(p("（征求意见稿）", { size: 24, color: "999999", alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== 模块一 ==========
  children.push(heading1("模块一  AIGC概要与建筑行业应用"));
  children.push(emptyLine());

  // 模块信息框
  children.push(tipBox(
    "模块信息",
    "课时安排：理论2课时 + 实践2课时\n教学目标：\n1. 理解AIGC的基本概念、发展历程与技术原理\n2. 了解国家人工智能发展战略与建筑行业数字化转型政策\n3. 认识AIGC在建筑全生命周期中的应用场景\n4. 掌握主流AIGC工具的分类与基本使用方法",
    "2E75B6", "EBF5FB"
  ));
  children.push(emptyLine());

  children.push(tipBox(
    "课程思政融入点",
    "- 科技自立自强：国产AI大模型的崛起（DeepSeek、通义千问、文心一言等）\n- 文化传承与创新：从\"样式雷\"到AIGC -- 中国建筑智慧的古今对话\n- 职业使命：数字化转型时代建筑从业者的责任与担当",
    "8E44AD", "F5EEF8"
  ));
  children.push(emptyLine());

  // --- 第1课时 ---
  children.push(heading2("第1课时  认识AIGC"));
  children.push(emptyLine());

  // 章节导读
  children.push(tipBox(
    "章节导读",
    "在过去的几百年里，建筑设计的表达方式经历了深刻的变革。清代皇家建筑世家\"样式雷\"家族，用精巧的\"烫样\"（立体模型）向皇帝呈现建筑方案，这是中国古代建筑师用技术手段辅助设计表达的杰出典范。如今，人工智能生成内容（AIGC）技术正在开启建筑设计表达的新纪元 -- 我们可以用一段文字描述，让AI在几秒钟内生成建筑效果图、室内渲染图、景观意向图，甚至生成方案展示视频。\n\n本课时将带你走进AIGC的世界，理解这项技术的本质，了解它的发展历程，以及它将如何深刻改变建筑行业的工作方式。",
    "E67E22", "FEF5E7"
  ));
  children.push(emptyLine());

  // 插图1-1
  children.push(imageSlot("1-1", "样式雷烫样与AI效果图对比",
    "左侧为故宫博物院藏\"样式雷\"烫样实物照片（如圆明园烫样），右侧为AI生成的同类建筑效果图，形成古今对比。中间可加箭头和文字\"从烫样到AIGC\"。",
    "通栏（宽度占满版心），高度约8cm",
    "烫样照片：故宫博物院官网公开资料（需标注出处）；AI效果图：用即梦AI或Midjourney生成"));
  children.push(emptyLine());

  // 一、AIGC是什么
  children.push(heading3("一、AIGC是什么？"));
  children.push(heading4("1.1 从三个缩写说起"));
  children.push(p("在正式学习之前，我们先厘清几个容易混淆的概念："));
  children.push(emptyLine());

  children.push(makeTable(
    ["缩写", "全称", "含义", "举例"],
    [
      ["AI", "Artificial Intelligence（人工智能）", "让机器具备类似人类智能的技术总称", "人脸识别、语音助手、自动驾驶"],
      ["GC", "Generated Content（生成内容）", "由某种方式生成的内容", "--"],
      ["AIGC", "AI Generated Content（人工智能生成内容）", "由AI自动生成的文字、图片、音频、视频等内容", "ChatGPT写文章、Midjourney画图"],
    ],
    [1500, 2500, 2800, 2226]
  ));
  children.push(emptyLine());

  children.push(p("与AIGC相关的还有两个概念需要了解："));
  children.push(bulletItemBold("PGC", "（Professionally Generated Content）：专业生成内容，如建筑设计师绘制的施工图"));
  children.push(bulletItemBold("UGC", "（User Generated Content）：用户生成内容，如业主在社交媒体发布的装修照片"));
  children.push(emptyLine());
  children.push(p([
    { text: "AIGC的本质", bold: true },
    { text: "：让AI成为内容的\"创作者\"。你只需要告诉AI你想要什么（输入指令），AI就能自动生成相应的内容（输出结果）。" },
  ]));
  children.push(emptyLine());

  // 1.2 生成式AI vs 传统AI
  children.push(heading4("1.2 生成式AI vs 传统AI"));
  children.push(p("为了更好地理解AIGC，我们需要区分两种AI："));
  children.push(emptyLine());

  children.push(makeTable(
    ["对比维度", "传统AI（分析式AI）", "生成式AI（AIGC）"],
    [
      ["核心能力", "识别、分类、预测", "创造、生成、设计"],
      ["工作方式", "从数据中找规律，给出判断", "学习大量数据后，创造新内容"],
      ["输入-输出", "图片 -> \"这是一栋住宅\"", "\"一栋现代风格住宅\" -> 生成效果图"],
      ["建筑行业例子", "结构安全检测、能耗预测", "生成效果图、撰写设计说明"],
      ["类比", "像一个\"鉴定师\"", "像一个\"创作者\""],
    ],
    [2000, 3513, 3513]
  ));
  children.push(emptyLine());

  // 插图1-2
  children.push(imageSlot("1-2", "传统AI vs 生成式AI工作方式对比图",
    "分为左右两栏。左栏\"传统AI\"：输入一张建筑照片 -> AI识别 -> 输出\"这是住宅建筑\"；右栏\"生成式AI\"：输入文字\"一栋现代别墅\" -> AI生成 -> 输出一张效果图。",
    "通栏，高度约6cm",
    "自行绘制信息图（用PPT/Canva），或用AI生成示意图"));
  children.push(emptyLine());

  children.push(tipBox("课堂思考", "你平时使用的手机功能中，哪些属于传统AI（如人脸解锁），哪些属于生成式AI（如AI修图）？", "E67E22", "FEF5E7"));
  children.push(emptyLine());

  // 1.3 AIGC能生成什么
  children.push(heading4("1.3 AIGC能生成什么？"));
  children.push(p("AIGC的\"生成\"能力覆盖了几乎所有内容形式："));
  children.push(emptyLine());

  children.push(makeTable(
    ["内容类型", "说明", "建筑行业应用举例"],
    [
      ["文字", "文章、报告、代码等", "设计说明书、可行性报告、规范解读"],
      ["图像", "照片、插画、效果图等", "建筑效果图、室内渲染图、景观意向图"],
      ["音频", "语音、音乐、音效等", "方案汇报配音、项目宣传配乐"],
      ["视频", "短片、动画、特效等", "建筑漫游动画、项目宣传片"],
      ["代码", "程序、网页、应用等", "项目展示网页、数据分析工具"],
      ["3D模型", "三维模型（发展中）", "AI辅助建筑建模（新兴方向）"],
    ],
    [2000, 3013, 4013]
  ));
  children.push(emptyLine());

  // 插图1-3
  children.push(imageSlot("1-3", "AIGC六大内容类型示意图",
    "六宫格布局，每格展示一种AIGC内容类型：文字（设计说明截图）、图像（AI建筑效果图）、音频（音频波形图标）、视频（建筑漫游动画截图）、代码（网页代码截图）、3D模型（AI建模示意）。每格配图标和标题文字。",
    "通栏，高度约10cm",
    "AI生成各类示例图片拼合，配合图标设计"));
  children.push(emptyLine());

  // 二、AIGC的发展历程
  children.push(heading3("二、AIGC的发展历程"));
  children.push(heading4("2.1 从规则到智能：AI发展简史"));
  children.push(emptyLine());

  // 插图1-4
  children.push(imageSlot("1-4", "AI发展历程时间轴信息图",
    "横向时间轴，分为四个阶段：1950s-1980s规则时代（专家系统）-> 1990s-2010s机器学习时代（图像识别、推荐系统）-> 2017-2022深度学习时代（AlphaGo、Transformer）-> 2022-至今大模型时代（ChatGPT、多模态、Agent）。每个阶段配代表性图标和关键词。",
    "通栏，高度约5cm",
    "自行绘制信息图（推荐用PPT/Canva制作）"));
  children.push(emptyLine());

  children.push(heading4("2.2 AIGC的关键里程碑"));
  children.push(emptyLine());

  children.push(makeTable(
    ["时间", "事件", "意义"],
    [
      ["2017年", "Google提出Transformer架构", "奠定了现代AI大模型的技术基础"],
      ["2020年", "GPT-3发布", "展示了AI强大的文字生成能力"],
      ["2022年6月", "Midjourney公测", "AI图像生成走向大众"],
      ["2022年11月", "ChatGPT发布", "AIGC引爆全球关注，两个月用户破亿"],
      ["2023年", "GPT-4、文心一言、通义千问等", "多模态能力提升，国产大模型崛起"],
      ["2024年", "Sora、可灵等视频生成模型", "AI视频生成取得重大突破"],
      ["2025年", "DeepSeek-R1、多模态Agent", "国产开源模型达到世界领先水平"],
    ],
    [1800, 3600, 3626]
  ));
  children.push(emptyLine());

  children.push(tipBox(
    "课程思政",
    "2025年初，中国团队DeepSeek发布的R1模型在多项基准测试中达到国际领先水平，且以开源方式发布，体现了中国在AI领域的科技实力与开放精神。这说明在人工智能这一关键领域，中国完全有能力实现自主创新、走在世界前列。",
    "8E44AD", "F5EEF8"
  ));
  children.push(emptyLine());

  // 2.3 AIGC技术原理
  children.push(heading4("2.3 AIGC技术的基本原理（通俗版）"));
  children.push(p("AIGC的核心技术是大语言模型（LLM）和扩散模型（Diffusion Model），它们的工作原理可以用以下类比来理解："));
  children.push(emptyLine());

  children.push(p([{ text: "文字生成的原理 -- \"超级联想\"", bold: true }]));
  children.push(p("想象一个读过海量书籍的人，当你说出一句话的开头，他能根据经验推测最可能的下一个词。大语言模型就是这样一个\"超级联想机器\"，它通过学习互联网上的海量文本，掌握了语言的规律，能够持续预测并生成连贯的文字内容。"));
  children.push(emptyLine());

  children.push(p([{ text: "图像生成的原理 -- \"从噪声中雕刻\"", bold: true }]));
  children.push(p("扩散模型的工作方式可以类比为雕塑：一块随机的噪点图（石头）-> 根据你的文字描述（设计图纸）-> 一步步去除噪点（凿掉多余的石头）-> 逐渐显现出清晰的图像（完成雕塑）。"));
  children.push(emptyLine());

  // 插图1-5
  children.push(imageSlot("1-5", "AI图像生成原理示意图（扩散模型）",
    "从左到右展示4-5个步骤：纯噪点图 -> 模糊轮廓 -> 初步建筑形态 -> 细节显现 -> 最终效果图。上方标注\"扩散模型去噪过程\"，下方标注每个步骤的说明。以建筑效果图为最终输出示例。",
    "通栏，高度约6cm",
    "用AI生成不同去噪阶段的建筑图片拼合，或用PPT制作流程示意图"));
  children.push(emptyLine());

  children.push(tipBox(
    "注意",
    "AI并不真正\"理解\"建筑设计，它是通过学习大量建筑图片的模式和特征，来生成看起来合理的新图像。这就是为什么AI有时会生成不符合实际的内容（我们将在模块二第6课时详细讨论\"AI幻觉\"问题）。",
    "E74C3C", "FDEDEC"
  ));
  children.push(emptyLine());

  // 三、AIGC对国家、行业和个人的影响
  children.push(heading3("三、AIGC对国家、行业和个人的影响"));
  children.push(heading4("3.1 国家层面：战略机遇与政策支持"));
  children.push(p("中国高度重视人工智能发展，出台了一系列重要政策："));
  children.push(emptyLine());

  children.push(makeTable(
    ["政策文件", "核心内容"],
    [
      ["《新一代人工智能发展规划》（2017）", "将AI上升为国家战略，提出2030年AI总体达到世界领先水平"],
      ["《关于加快场景创新以人工智能高水平应用促进经济高质量发展的指导意见》（2022）", "推动AI在城市管理、建筑等领域的场景应用"],
      ["《生成式人工智能服务管理暂行办法》（2023）", "规范AIGC发展，鼓励创新应用"],
      ["教育部《高等学校人工智能赋能教育教学改革实施方案》", "要求加强AI素养教育，推动教学改革"],
      ["住建部数字化转型系列文件", "推进建筑行业智能建造和数字化转型"],
    ],
    [4513, 4513]
  ));
  children.push(emptyLine());

  // 插图1-6
  children.push(imageSlot("1-6", "国家AI政策体系图",
    "以中央为核心、向外辐射的结构图：中央\"国家AI战略\" -> 各部委政策（教育部、住建部、科技部等）-> 各行业应用。重点突出与建筑教育相关的政策。",
    "半栏（居中），高度约8cm",
    "自行绘制信息图"));
  children.push(emptyLine());

  children.push(heading4("3.2 行业层面：建筑行业的数字化转型"));
  children.push(p([{ text: "传统工作流程 vs AIGC赋能的工作流程", bold: true }]));
  children.push(emptyLine());

  children.push(makeTable(
    ["阶段", "传统方式", "AIGC赋能后"],
    [
      ["方案构思", "手绘草图 -> 反复修改 -> 数日完成", "AI快速生成多个方案 -> 分钟级完成"],
      ["效果图制作", "3D建模 -> 渲染 -> 后期 -> 数天", "文字描述/草图 -> AI生成 -> 数分钟"],
      ["设计说明", "人工撰写 -> 反复修改 -> 数小时", "AI辅助生成 -> 人工审核 -> 数十分钟"],
      ["方案汇报", "制作PPT -> 录制视频 -> 数天", "AI一键生成PPT和视频 -> 数小时"],
      ["规范查询", "翻阅规范文件 -> 人工检索", "AI知识库 -> 智能问答 -> 秒级响应"],
    ],
    [2000, 3513, 3513]
  ));
  children.push(emptyLine());

  // 插图1-7
  children.push(imageSlot("1-7", "传统工作流 vs AIGC工作流对比信息图",
    "上下两行对比流程图。上行\"传统方式\"：手绘草图(2天) -> 3D建模(3天) -> 渲染出图(1天) -> 撰写文本(1天) -> 制作PPT(1天) = 约8天。下行\"AIGC方式\"：AI生成方案(10分钟) -> AI效果图(5分钟) -> AI撰写文本(30分钟) -> AI生成PPT(10分钟) = 约1小时。强烈的效率对比。",
    "通栏，高度约8cm",
    "自行绘制信息图（用PPT/Canva）"));
  children.push(emptyLine());

  children.push(heading4("3.3 个人层面：职业发展的新要求"));
  children.push(p([{ text: "AIGC对建筑从业者的影响可以概括为\"三个转变\"：", bold: true }]));
  children.push(bulletItemBold("工具转变：", "从手动操作到AI辅助，效率大幅提升"));
  children.push(bulletItemBold("能力转变：", "从\"会画图\"到\"会指挥AI画图\"，提示词能力成为新技能"));
  children.push(bulletItemBold("角色转变：", "从\"执行者\"到\"决策者\"，人的核心价值在于审美、判断和创新"));
  children.push(emptyLine());

  children.push(p([{ text: "建筑专业学生应具备的AIGC素养：", bold: true }]));
  children.push(bulletItem("能熟练使用AI工具辅助专业学习和工作"));
  children.push(bulletItem("能编写有效的提示词，控制AI输出质量"));
  children.push(bulletItem("能判断AI生成内容的准确性和专业性"));
  children.push(bulletItem("了解AI的局限性和使用边界"));
  children.push(bulletItem("具备AI伦理意识和法律常识"));
  children.push(emptyLine());

  // 四、如何学习AIGC
  children.push(heading3("四、如何学习AIGC"));
  children.push(heading4("4.1 学习AIGC的正确姿势"));

  children.push(p([{ text: "1. \"用\"比\"学\"更重要", bold: true }]));
  children.push(p("AIGC工具的操作并不复杂，关键是在实际场景中反复使用。就像学游泳，看再多理论不如下水实践。"));
  children.push(p([{ text: "2. 保持持续学习的心态", bold: true }]));
  children.push(p("AIGC技术发展极快，工具和功能几乎每月都在更新。重要的是掌握学习方法，而不是死记某个工具的操作步骤。"));
  children.push(p([{ text: "3. 结合专业场景学习", bold: true }]));
  children.push(p("不要为了学AI而学AI，而要思考\"这个AI工具能帮我解决什么专业问题\"。"));
  children.push(p([{ text: "4. 学会提问比学会回答更重要", bold: true }]));
  children.push(p("与AI交互的核心是\"提问\"。一个好的提示词（Prompt）往往比选择哪个AI工具更重要。"));
  children.push(emptyLine());

  children.push(heading4("4.2 推荐的学习路径"));
  children.push(emptyLine());

  // 插图1-8
  children.push(imageSlot("1-8", "AIGC学习路径阶梯图",
    "从下到上的阶梯/台阶图：入门阶段（文字对话，学会与AI交流）-> 进阶阶段（图像生成，建筑设计可视化）-> 提升阶段（音视频+PPT，完整方案展示）-> 高阶阶段（智能体+编程，个人AI工作流）。每级台阶标注对应的模块编号。",
    "半栏（居中），高度约8cm",
    "自行绘制信息图"));
  children.push(emptyLine());

  children.push(tipBox("提示", "本教材正是按照这个学习路径编排的。", "2E75B6", "EBF5FB"));
  children.push(emptyLine());
  children.push(makeSep());

  // ===== 第2课时 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2("第2课时  AIGC与建筑行业"));
  children.push(emptyLine());

  children.push(tipBox(
    "章节导读 -- 从\"样式雷\"说起",
    "清代雷氏家族七代人主持皇家建筑设计长达200余年，留下了大量珍贵的建筑图档和\"烫样\"。\"烫样\"是用纸板、秫秸杆、木头等材料制作的建筑立体模型，可以层层拆卸，展示建筑内部结构 -- 这是古代建筑师向决策者展示设计方案的\"可视化工具\"。今天，AIGC让我们能用文字描述瞬间生成逼真的效果图和漫游视频，本质上与\"样式雷\"的烫样一样，都是用当时最先进的技术手段来更好地表达设计意图。从烫样到AIGC，变的是技术手段，不变的是中国建筑师对卓越表达的追求。",
    "E67E22", "FEF5E7"
  ));
  children.push(emptyLine());

  // 插图1-9
  children.push(imageSlot("1-9", "样式雷烫样实物照片",
    "展示1-2张故宫博物院藏样式雷烫样的精美照片，如圆明园万方安和烫样或颐和园全景烫样。配简要文字说明：\"样式雷烫样 -- 中国古代建筑师的'可视化工具'\"。",
    "半栏（居中），高度约8cm",
    "故宫博物院官网或\"样式雷\"研究协会提供（需标注出处并获取授权）"));
  children.push(emptyLine());

  // 一、建筑行业AIGC应用全景图
  children.push(heading3("一、建筑行业AIGC应用全景图"));
  children.push(p("AIGC技术可以贯穿建筑项目的全生命周期，在每个阶段都有具体的应用场景："));
  children.push(emptyLine());

  // 插图1-10
  children.push(imageSlot("1-10", "建筑全生命周期AIGC应用全景图",
    "环形或横向流程图，展示建筑四个阶段：规划阶段 -> 设计阶段 -> 施工阶段 -> 运维阶段。每个阶段下方列出2-3个AIGC应用方向，配小图标。整体视觉效果要专业、清晰。",
    "通栏，高度约8cm",
    "自行绘制信息图（推荐用PPT/Canva）"));
  children.push(emptyLine());

  children.push(heading4("1.1 规划阶段"));
  children.push(makeTable(
    ["应用方向", "具体场景", "涉及专业"],
    [
      ["AI场地分析", "输入地块信息，AI分析日照、风环境、交通等", "城乡规划"],
      ["AI方案生成", "输入设计条件，AI自动生成多个布局方案", "城乡规划、建筑设计"],
      ["AI政策解读", "AI辅助解读规划政策和设计条件", "城乡规划"],
      ["AI数据可视化", "AI辅助制作规划分析图和数据图表", "城乡规划"],
    ],
    [2500, 4026, 2500]
  ));
  children.push(emptyLine());

  children.push(heading4("1.2 设计阶段"));
  children.push(makeTable(
    ["应用方向", "具体场景", "涉及专业"],
    [
      ["AI效果图", "文字/草图生成建筑效果图", "建筑设计、室内设计、园林景观"],
      ["AI方案对比", "快速生成多风格方案供业主选择", "室内设计、建筑设计"],
      ["AI设计说明", "自动生成设计说明书等文本", "所有专业"],
      ["AI材料选型", "AI推荐材料搭配方案", "室内设计、园林景观"],
    ],
    [2500, 3526, 3000]
  ));
  children.push(emptyLine());

  children.push(heading4("1.3 施工阶段"));
  children.push(makeTable(
    ["应用方向", "具体场景", "涉及专业"],
    [
      ["AI安全监测", "AI识别施工现场安全隐患", "建筑设计（安全管理）"],
      ["AI进度管理", "AI辅助分析施工进度数据", "建筑设计"],
      ["AI安全培训", "AI生成安全培训图文和视频", "所有专业"],
    ],
    [2500, 3526, 3000]
  ));
  children.push(emptyLine());

  children.push(heading4("1.4 运维阶段"));
  children.push(makeTable(
    ["应用方向", "具体场景", "涉及专业"],
    [
      ["AI智慧物业", "智能客服、设备巡检报告", "园林景观（物业管理）"],
      ["AI能耗管理", "分析建筑能耗数据，优化运行策略", "建筑设计"],
    ],
    [2500, 3526, 3000]
  ));
  children.push(emptyLine());

  // 二、四大专业方向
  children.push(heading3("二、四大专业方向的AIGC应用重点"));
  children.push(p("根据人居环境与艺术学院的四个专业方向，AIGC的应用侧重各有不同："));
  children.push(emptyLine());

  // 插图1-11
  children.push(imageSlot("1-11", "四大专业方向AIGC应用重点矩阵图",
    "2x2矩阵布局，四个象限分别为：城乡规划（鸟瞰图图标+关键词）、建筑设计（建筑图标+关键词）、室内设计（室内图标+关键词）、园林景观（园林图标+关键词）。每个象限列出3-4个核心应用关键词。",
    "通栏，高度约10cm",
    "自行绘制信息图，配合AI生成的四个方向代表性效果图缩略图"));
  children.push(emptyLine());

  const directions = [
    { title: "2.1 城乡规划方向", scene: "接到一个乡村振兴规划项目，用AI快速分析场地现状、生成多个布局方案的效果图、撰写规划说明书、制作汇报PPT和视频。", apps: ["AI辅助场地分析与方案生成", "AI生成规划效果图（鸟瞰图、街景图）", "AI撰写规划分析报告", "AI制作规划方案汇报材料", "AI数据分析与可视化"] },
    { title: "2.2 建筑设计方向", scene: "在方案初期，用文字描述建筑风格和功能需求，AI快速生成多个方案效果图供讨论；将手绘草图上传，AI生成精美的渲染效果图。", apps: ["AI生成建筑方案效果图", "手绘草图/白模 -> AI渲染", "AI撰写设计说明书", "AI辅助规范查询", "AI生成施工安全培训材料"] },
    { title: "2.3 室内设计方向", scene: "业主说\"我想要北欧风格的客厅\"，用AI在1分钟内生成10种北欧风格客厅效果图，业主当场选择喜欢的方向，大幅缩短沟通成本。", apps: ["AI生成不同风格室内效果图", "AI辅助方案对比与业主沟通", "AI生成材料搭配方案", "AI撰写室内设计说明", "AI制作方案展示视频"] },
    { title: "2.4 园林景观方向", scene: "为一个城市公园项目生成不同季节、不同时段的景观效果图，用AI制作四季变换的景观漫游视频。", apps: ["AI生成景观意向图和效果图", "AI生成景观节点效果图", "AI植物配置方案建议", "AI撰写景观设计文本", "AI生成项目宣传视频"] },
  ];

  directions.forEach(d => {
    children.push(heading4(d.title));
    children.push(p([{ text: "核心应用：", bold: true }]));
    d.apps.forEach(app => children.push(bulletItem(app)));
    children.push(p([{ text: "典型场景：", bold: true, color: "2E75B6" }, { text: d.scene }]));
    children.push(emptyLine());
  });

  // 三、常用AIGC工具清单
  children.push(heading3("三、常用AIGC工具清单"));
  children.push(tipBox("说明", "AIGC工具更新迭代非常快，以下为截至本教材编写时（2026年）的主流工具。最新工具信息请扫描本页二维码，访问配套小程序获取实时更新。", "2E75B6", "EBF5FB"));
  children.push(emptyLine());

  // 插图1-12
  children.push(imageSlot("1-12", "AIGC工具分类导航图",
    "树状图或分类卡片布局：AIGC工具 -> 文字类（DeepSeek、Kimi、ChatGPT...）、图像类（即梦、可灵、Midjourney...）、视频类（可灵、即梦...）、音频类（豆包、Suno...）、综合平台（Coze、WPS AI...）。每个工具配logo小图标。",
    "通栏，高度约10cm",
    "自行绘制分类图，工具logo可从各工具官网获取"));
  children.push(emptyLine());

  children.push(heading4("3.1 文字生成类工具"));
  children.push(makeTable(
    ["工具名称", "特点", "访问方式", "推荐指数"],
    [
      ["DeepSeek", "国产开源，推理能力强，免费", "deepseek.com", "\u2605\u2605\u2605\u2605\u2605"],
      ["Kimi（月之暗面）", "支持超长文本，擅长文档分析", "kimi.moonshot.cn", "\u2605\u2605\u2605\u2605\u2605"],
      ["通义千问（阿里）", "功能全面，支持多模态", "tongyi.aliyun.com", "\u2605\u2605\u2605\u2605"],
      ["豆包（字节跳动）", "综合能力强，生态丰富", "doubao.com", "\u2605\u2605\u2605\u2605"],
      ["文心一言（百度）", "中文理解能力强", "yiyan.baidu.com", "\u2605\u2605\u2605\u2605"],
      ["ChatGPT（OpenAI）", "全球领先，英文能力强", "chatgpt.com（需科学上网）", "\u2605\u2605\u2605\u2605\u2605"],
      ["Claude（Anthropic）", "长文本处理、编程能力突出", "claude.ai（需科学上网）", "\u2605\u2605\u2605\u2605\u2605"],
    ],
    [2200, 2800, 2600, 1426]
  ));
  children.push(emptyLine());

  children.push(heading4("3.2 图像生成类工具"));
  children.push(makeTable(
    ["工具名称", "特点", "访问方式", "推荐指数"],
    [
      ["即梦AI（字节跳动）", "国产，免费额度多，效果好", "jimeng.jianying.com", "\u2605\u2605\u2605\u2605\u2605"],
      ["可灵AI（快手）", "图片视频一体，效果出色", "klingai.kuaishou.com", "\u2605\u2605\u2605\u2605\u2605"],
      ["通义万相（阿里）", "免费，集成在通义千问中", "tongyi.aliyun.com", "\u2605\u2605\u2605\u2605"],
      ["Midjourney", "艺术性强，建筑效果图优秀", "midjourney.com（需科学上网）", "\u2605\u2605\u2605\u2605\u2605"],
      ["Stable Diffusion", "开源免费，可本地部署", "本地部署", "\u2605\u2605\u2605\u2605"],
    ],
    [2200, 2800, 2600, 1426]
  ));
  children.push(emptyLine());

  children.push(heading4("3.3 视频生成类工具"));
  children.push(makeTable(
    ["工具名称", "特点", "访问方式", "推荐指数"],
    [
      ["可灵AI", "国产领先，图生视频效果好", "klingai.kuaishou.com", "\u2605\u2605\u2605\u2605\u2605"],
      ["即梦AI", "多种生成模式，操作简单", "jimeng.jianying.com", "\u2605\u2605\u2605\u2605\u2605"],
      ["Runway", "功能全面，专业级", "runway.ml（需科学上网）", "\u2605\u2605\u2605\u2605"],
    ],
    [2200, 2800, 2600, 1426]
  ));
  children.push(emptyLine());

  children.push(heading4("3.4 音频生成类工具"));
  children.push(makeTable(
    ["工具名称", "特点", "访问方式", "推荐指数"],
    [
      ["豆包/剪映", "文字转语音，多种音色", "doubao.com / 剪映App", "\u2605\u2605\u2605\u2605\u2605"],
      ["Suno", "AI音乐生成", "suno.com", "\u2605\u2605\u2605\u2605"],
      ["NotebookLM（Google）", "双人播客生成", "notebooklm.google.com", "\u2605\u2605\u2605\u2605"],
    ],
    [2200, 2800, 2600, 1426]
  ));
  children.push(emptyLine());

  children.push(heading4("3.5 综合平台与辅助工具"));
  children.push(makeTable(
    ["工具名称", "用途", "访问方式"],
    [
      ["Coze/扣子（字节跳动）", "智能体和工作流搭建", "coze.cn"],
      ["Dify", "开源AI应用开发平台", "dify.ai"],
      ["WPS AI", "AI辅助办公（PPT、文档等）", "wps.cn"],
      ["Cursor", "AI辅助编程IDE", "cursor.com"],
      ["OpenClaw", "AI编程+手机通信", "（详见模块七）"],
    ],
    [3000, 3026, 3000]
  ));
  children.push(emptyLine());

  // 四、课堂互动
  children.push(heading3("四、课堂互动与实践引导"));
  children.push(heading4("4.1 课堂讨论"));
  children.push(p("请思考并回答以下问题："));
  children.push(bulletItem("你在专业学习中遇到过哪些问题，觉得可以用AI来解决？"));
  children.push(bulletItem("你之前是否使用过任何AI工具？使用体验如何？"));
  children.push(bulletItem("你认为AI会取代建筑设计师吗？为什么？"));
  children.push(emptyLine());

  children.push(heading4("4.2 课后任务"));
  children.push(p([{ text: "1. 工具注册：", bold: true }, { text: "注册至少2个文字类AI工具（推荐DeepSeek + Kimi），1个图像类AI工具（推荐即梦AI或可灵AI）" }]));
  children.push(p([{ text: "2. 初步体验：", bold: true }, { text: "用任意一个文字AI工具，询问一个与你专业相关的问题，截图记录AI的回答" }]));
  children.push(p([{ text: "3. 思考题：", bold: true }, { text: "阅读下方\"知识拓展\"中关于\"样式雷\"的内容，写一段200字的感想：你认为\"样式雷\"的烫样和今天的AI效果图有哪些相似之处和不同之处？" }]));
  children.push(emptyLine());

  // 知识拓展
  children.push(makeSep());
  children.push(heading3("知识拓展：样式雷与中国建筑智慧"));
  children.push(p("\"样式雷\"是清代雷氏建筑世家的美称。从康熙年间的雷发达开始，雷氏家族七代人主持皇家建筑设计，参与了故宫、天坛、圆明园、颐和园、清东陵、清西陵等重大工程的设计与营建。"));
  children.push(p("雷氏家族最具特色的贡献是创造了\"烫样\" -- 一种用硬纸板、秫秸杆、木头等材料制作的建筑立体模型。烫样可以层层拆卸，展示建筑的外观、内部结构和周围环境，是向皇帝呈报设计方案的重要工具。"));
  children.push(p("2007年，\"样式雷\"建筑图档被联合国教科文组织列入《世界记忆名录》，成为中国建筑文化的世界级遗产。"));
  children.push(emptyLine());

  // 插图1-13
  children.push(imageSlot("1-13", "样式雷建筑图档与烫样精选",
    "展示2-3张样式雷经典作品：1）建筑平面图档（如紫禁城相关图纸）；2）烫样实物照片（展示可拆卸的层次结构）；3）烫样细节特写。配简要文字说明。",
    "通栏，高度约10cm",
    "故宫博物院、中国国家图书馆公开资料，或\"样式雷\"研究协会提供（需获取授权并标注出处）"));
  children.push(emptyLine());

  children.push(p([{ text: "从\"烫样\"到AIGC的启示：", bold: true }]));
  children.push(makeTable(
    ["维度", "样式雷的烫样", "今天的AIGC"],
    [
      ["目的", "让决策者直观理解设计方案", "让客户和团队快速看到设计效果"],
      ["技术", "纸板、木材、手工制作", "算法、大模型、自动生成"],
      ["效率", "数周制作一个烫样", "数分钟生成一张效果图"],
      ["精神", "精益求精、世代传承", "持续创新、技术迭代"],
    ],
    [1500, 3763, 3763]
  ));
  children.push(emptyLine());
  children.push(p([{ text: "共同点：", bold: true, color: "2E75B6" }, { text: "都是用当时最先进的技术手段，辅助建筑设计的表达与沟通。" }]));
  children.push(emptyLine());

  // 二维码占位
  children.push(imageSlot("1-14", "扫码了解更多\"样式雷\"相关内容",
    "二维码图片，链接到配套小程序中\"样式雷\"专题页面或公众号相关推文。",
    "小尺寸（4cm x 4cm），右对齐",
    "待小程序/公众号上线后生成二维码"));
  children.push(emptyLine());

  // 实践课指导
  children.push(makeSep());
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2("实践课指导（2课时）"));
  children.push(emptyLine());

  children.push(heading3("实践一：AIGC工具初体验（1课时）"));
  children.push(p([{ text: "实践目标：", bold: true }, { text: "注册并体验主流AIGC工具，建立对AI能力的直观认识" }]));
  children.push(emptyLine());

  // 插图1-15
  children.push(imageSlot("1-15", "DeepSeek对话界面截图",
    "DeepSeek网页版的完整界面截图，标注关键区域：1）左侧历史对话列表；2）中部对话主区域；3）底部输入框；4）新建对话按钮。用红色方框和箭头标注。",
    "通栏，高度约8cm",
    "自行截图（打开DeepSeek官网截图）"));
  children.push(emptyLine());

  children.push(p([{ text: "步骤1：注册工具账号（15分钟）", bold: true }]));
  children.push(bulletItem("注册DeepSeek账号（deepseek.com）"));
  children.push(bulletItem("注册即梦AI账号（jimeng.jianying.com）"));
  children.push(emptyLine());

  children.push(p([{ text: "步骤2：文字AI体验（15分钟）", bold: true }]));
  children.push(p("打开DeepSeek，尝试以下对话："));
  children.push(bulletItem("\"请介绍一下现代主义建筑的特点\""));
  children.push(bulletItem("\"帮我解释《建筑设计防火规范》中关于疏散通道宽度的规定\""));
  children.push(bulletItem("\"用300字描述一个新中式风格的住宅小区入口景观\""));
  children.push(p("观察AI回答的质量，思考：哪些回答有用？哪些可能有误？"));
  children.push(emptyLine());

  children.push(p([{ text: "步骤3：图像AI体验（15分钟）", bold: true }]));
  children.push(p("打开即梦AI，尝试生成以下图像："));
  children.push(bulletItem("\"现代简约风格的客厅效果图，大落地窗，阳光充足\""));
  children.push(bulletItem("\"鸟瞰视角的住宅小区规划效果图，中式园林景观\""));
  children.push(bulletItem("\"新中式风格的茶室室内效果图，竹子元素，禅意\""));
  children.push(emptyLine());

  // 插图1-16
  children.push(imageSlot("1-16", "即梦AI生成建筑效果图示例",
    "展示即梦AI的操作界面截图，以及用上述三个提示词生成的效果图（共3张小图拼合）。标注输入的提示词和生成结果的对应关系。",
    "通栏，高度约10cm",
    "自行截图（在即梦AI中实际生成并截图）"));
  children.push(emptyLine());

  children.push(p([{ text: "步骤4：记录与分享（15分钟）", bold: true }]));
  children.push(bulletItem("将体验过程截图保存"));
  children.push(bulletItem("与同学分享你最满意的一张AI生成图片"));
  children.push(bulletItem("记录使用过程中遇到的问题和困惑"));
  children.push(emptyLine());

  children.push(heading3("实践二：建筑行业AIGC应用案例探索（1课时）"));
  children.push(p([{ text: "实践目标：", bold: true }, { text: "探索AIGC在自己专业方向的具体应用，建立学习目标" }]));
  children.push(emptyLine());

  children.push(p([{ text: "步骤1：案例检索（20分钟）", bold: true }]));
  children.push(p("用AI搜索并整理\"AIGC+你的专业方向\"的应用案例。按专业方向分组检索："));
  children.push(bulletItem("城乡规划方向：搜索\"AI辅助城市规划案例\""));
  children.push(bulletItem("建筑设计方向：搜索\"AI建筑效果图应用案例\""));
  children.push(bulletItem("室内设计方向：搜索\"AI室内设计工具\""));
  children.push(bulletItem("园林景观方向：搜索\"AI景观设计应用\""));
  children.push(p("整理3-5个你觉得最有价值的应用案例。"));
  children.push(emptyLine());

  children.push(p([{ text: "步骤2：分析与讨论（20分钟）", bold: true }]));
  children.push(bulletItem("小组讨论：每组选择一个最感兴趣的AIGC应用方向"));
  children.push(bulletItem("分析该应用的优势、局限和发展前景"));
  children.push(bulletItem("思考：这个应用在你未来的工作中可能如何使用？"));
  children.push(emptyLine());

  children.push(p([{ text: "步骤3：个人学习计划（20分钟）", bold: true }]));
  children.push(bulletItem("我最想掌握的3个AI工具是什么？"));
  children.push(bulletItem("我最想用AI解决的专业问题是什么？"));
  children.push(bulletItem("本学期我的AI学习目标是什么？"));
  children.push(p("将学习计划记录在作品展示页。"));
  children.push(emptyLine());

  // 本章小结
  children.push(makeSep());
  children.push(heading3("本章小结"));
  children.push(makeTable(
    ["知识点", "核心内容"],
    [
      ["AIGC定义", "人工智能生成内容，包括文字、图像、音频、视频等"],
      ["发展历程", "规则时代 -> 机器学习 -> 深度学习 -> 大模型时代"],
      ["国家政策", "AI国家战略、AIGC管理办法、教育AI赋能、住建部数字化转型"],
      ["行业影响", "贯穿建筑全生命周期：规划 -> 设计 -> 施工 -> 运维"],
      ["个人影响", "工具转变、能力转变、角色转变"],
      ["学习方法", "\"用\"比\"学\"重要，结合专业场景，保持持续学习"],
      ["文化传承", "从\"样式雷\"到AIGC -- 中国建筑智慧的古今对话"],
    ],
    [2500, 6526]
  ));
  children.push(emptyLine());

  children.push(tipBox("下一模块预告", "模块二将深入学习文字生成技术，掌握提示词工程的核心方法，学会用AI撰写建筑专业文本。", "2E75B6", "EBF5FB"));
  children.push(emptyLine());

  // 二维码
  children.push(imageSlot("1-17", "本章配套资源二维码",
    "包含两个二维码并排：1）\"扫码获取本章配套视频教程\"（链接小程序）；2）\"扫码获取最新工具列表\"（链接公众号）。",
    "半栏（居中），高度约5cm",
    "待小程序/公众号上线后生成二维码"));
  children.push(emptyLine());

  // ========== 分页进入模块二 ==========
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== 模块二 ==========
  children.push(heading1("模块二  文字生成 -- 建筑文本写作"));
  children.push(emptyLine());

  children.push(tipBox(
    "模块信息",
    "课时安排：理论4课时 + 实践4课时\n教学目标：\n1. 掌握与AI对话的基本方法，能用AI辅助专业学习\n2. 理解提示词工程的核心原理，掌握提示词七要素\n3. 能运用AI生成建筑专业文本（设计说明、分析报告、方案文本等）\n4. 认识AI幻觉现象，掌握信息验证的基本方法",
    "2E75B6", "EBF5FB"
  ));
  children.push(emptyLine());

  children.push(tipBox(
    "课程思政融入点",
    "- 学术诚信：AI辅助写作的边界与规范\n- 工匠精神：AI是工具，专业判断力才是核心竞争力\n- 文化自信：用AI传播中国建筑文化",
    "8E44AD", "F5EEF8"
  ));
  children.push(emptyLine());

  // --- 第3课时 ---
  children.push(heading2("第3课时  基础对话与学习辅助"));
  children.push(emptyLine());

  children.push(tipBox(
    "章节导读",
    "文字生成是AIGC最基础也最常用的能力。对于建筑专业学生而言，AI文字助手就像一位随时在线的\"学习伙伴\" -- 它可以帮你解读复杂的建筑规范、翻译英文文献、分析设计案例、整理学习笔记。本课时将教你如何与AI进行有效对话，让它真正成为你的专业学习助手。",
    "E67E22", "FEF5E7"
  ));
  children.push(emptyLine());

  children.push(heading3("一、与AI对话的基本方法"));
  children.push(heading4("1.1 认识对话界面"));
  children.push(p("以DeepSeek为例，AI对话界面的核心要素包括：新建对话按钮、历史对话列表、对话主区域、输入框和发送按钮。"));
  children.push(emptyLine());

  // 插图2-1
  children.push(imageSlot("2-1", "AI对话界面功能标注图",
    "以DeepSeek为例的完整界面截图，用带编号的红色标注框标出：1-新建对话按钮、2-历史对话列表、3-对话主区域、4-输入框、5-发送按钮、6-复制按钮、7-重新生成按钮。",
    "通栏，高度约8cm",
    "自行截图并用截图标注工具（如Snipaste、微信截图）添加标注"));
  children.push(emptyLine());

  children.push(p([{ text: "基本操作要点：", bold: true }]));
  children.push(bulletItemBold("新建对话：", "每个新话题建议开一个新对话，避免上下文混乱"));
  children.push(bulletItemBold("连续追问：", "在同一对话中可以持续追问，AI会记住上下文"));
  children.push(bulletItemBold("复制回答：", "AI回答通常可以一键复制，方便粘贴到文档中"));
  children.push(bulletItemBold("重新生成：", "对回答不满意可以点击\"重新生成\"，AI会给出不同的版本"));
  children.push(emptyLine());

  // 1.2 提问的五个层次
  children.push(heading4("1.2 提问的五个层次"));
  children.push(p("与AI对话的质量，很大程度上取决于你\"问\"的水平："));
  children.push(emptyLine());

  children.push(makeTable(
    ["层次", "提问方式", "示例", "回答质量"],
    [
      ["L1 模糊提问", "随意提问，没有具体方向", "\"建筑设计怎么做？\"", "回答笼统、泛泛而谈"],
      ["L2 具体提问", "有明确的问题", "\"现代主义建筑有哪些特点？\"", "回答准确但较基础"],
      ["L3 场景提问", "结合具体场景", "\"现代主义风格在学校建筑中有哪些适合的应用？\"", "回答有针对性"],
      ["L4 结构化提问", "明确角色、要求和格式", "\"你是建筑设计专家，请从造型、材料、空间三个维度分析...\"", "回答专业、有条理"],
      ["L5 系统化提问", "多轮对话，逐步深入", "先问概述 -> 再问细节 -> 追问案例 -> 要求总结", "回答全面、深入"],
    ],
    [1800, 2200, 3200, 1826]
  ));
  children.push(emptyLine());

  // 插图2-2
  children.push(imageSlot("2-2", "提问五层次对比效果图",
    "展示同一问题\"建筑设计\"在L1和L4两个层次的实际AI对话截图对比。左栏L1模糊提问的回答（简短、泛泛）；右栏L4结构化提问的回答（详细、专业、有条理）。用红绿色标注差异。",
    "通栏，高度约12cm",
    "自行在DeepSeek中实际对话并截图，左右拼合对比"));
  children.push(emptyLine());

  children.push(tipBox("关键原则", "你给AI的信息越具体，AI给你的回答就越有用。", "27AE60", "EAFAF1"));
  children.push(emptyLine());

  // 1.3 典型场景
  children.push(heading4("1.3 AI对话的典型场景"));
  children.push(emptyLine());

  const scenes = [
    { name: "场景1：知识学习", imgId: "2-3", imgTitle: "AI辅助学习建筑知识 -- 对话截图", imgContent: "展示在DeepSeek中询问\"容积率\"概念的完整对话截图，AI给出通俗易懂的解释，包含计算公式和实际案例。" },
    { name: "场景2：规范解读", imgId: "2-4", imgTitle: "AI辅助规范解读 -- 对话截图", imgContent: "展示在AI中询问《建筑设计防火规范》疏散楼梯要求的对话截图。特别标注AI回答中需要核实的规范条号（用红色标注）。" },
    { name: "场景3：翻译辅助", imgId: "2-5", imgTitle: "AI建筑英文翻译 -- 对话截图", imgContent: "展示AI翻译建筑英文摘要的对话截图，展示保留专业术语英文原文和词汇对照表的效果。" },
    { name: "场景4：案例分析", imgId: "2-6", imgTitle: "AI建筑案例分析 -- 对话截图", imgContent: "展示AI从多维度分析安藤忠雄\"光之教堂\"的对话截图，展示AI分析的结构化输出效果。" },
    { name: "场景5：归纳总结", imgId: "2-7", imgTitle: "AI归纳总结学习笔记 -- 对话截图", imgContent: "展示AI将零散笔记整理成思维导图大纲格式的对话截图，展示输入（零散笔记）和输出（结构化大纲）的对比。" },
  ];

  scenes.forEach(s => {
    children.push(p([{ text: s.name, bold: true, size: 26 }]));
    children.push(emptyLine());
    children.push(imageSlot(s.imgId, s.imgTitle, s.imgContent, "通栏，高度约8cm", "自行在AI工具中实际操作并截图"));
    children.push(emptyLine());
  });

  // 二、高效对话技巧
  children.push(heading3("二、高效对话的实用技巧"));
  children.push(heading4("2.1 让AI扮演特定角色"));
  children.push(p("在提问前指定AI的身份，可以让回答更加专业和有针对性："));
  children.push(emptyLine());

  children.push(makeTable(
    ["角色指令", "适用场景"],
    [
      ["\"你是一位有20年经验的建筑设计师\"", "咨询设计方案、审查设计文件"],
      ["\"你是一位城乡规划专业的教授\"", "学习规划理论、准备考试"],
      ["\"你是一位室内设计公司的总监\"", "讨论设计风格、材料选择"],
      ["\"你是一位园林景观设计专家\"", "植物配置、景观节点设计"],
      ["\"你是一位建筑规范审查员\"", "检查设计是否符合规范"],
    ],
    [4513, 4513]
  ));
  children.push(emptyLine());

  children.push(heading4("2.2 指定输出格式"));
  children.push(p("告诉AI你想要什么格式的输出，比自由发挥效果好得多："));
  children.push(bulletItem("\"请用表格形式对比...\""));
  children.push(bulletItem("\"请用分点列出...\""));
  children.push(bulletItem("\"请用思维导图大纲形式整理...\""));
  children.push(bulletItem("\"请控制在500字以内...\""));
  children.push(bulletItem("\"请分为三个部分：概述、详解、总结\""));
  children.push(emptyLine());

  children.push(heading4("2.3 提供参考资料"));
  children.push(p("当你需要AI处理特定内容时，直接把资料粘贴给它："));
  children.push(emptyLine());
  children.push(tipBox("有效的做法", "\"请根据以下设计任务书的内容，提取关键设计要求并整理成表格：[粘贴设计任务书内容]\"", "27AE60", "EAFAF1"));
  children.push(tipBox("低效的做法", "\"帮我整理一下设计任务书的要求\"（AI不知道你的任务书内容是什么）", "E74C3C", "FDEDEC"));
  children.push(emptyLine());

  children.push(heading4("2.4 多轮对话深入探索"));
  children.push(p("不要试图一次问完所有问题，善用多轮对话逐步深入："));
  children.push(codeBlock([
    "第1轮：请概述绿色建筑评价标准的主要内容",
    "第2轮：请详细说明\"节能与能源利用\"这个评分项的要求",
    "第3轮：其中关于外墙保温的要求，常用的做法有哪些？",
    "第4轮：在夏热冬冷地区，推荐哪种保温做法？",
    "第5轮：请帮我整理以上内容，输出一份学习笔记",
  ]));
  children.push(emptyLine());

  // ===== 第4课时 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2("第4课时  提示词工程"));
  children.push(emptyLine());

  children.push(tipBox(
    "章节导读",
    "上一课时我们学会了与AI进行基础对话。但你可能已经发现，有时候AI的回答不够专业、不够具体、格式不理想。这是因为你的\"指令\" -- 也就是提示词（Prompt） -- 还不够精确。本课时将系统学习提示词工程，让你能够精准控制AI的输出。",
    "E67E22", "FEF5E7"
  ));
  children.push(emptyLine());

  // 一、为什么需要提示词
  children.push(heading3("一、为什么需要提示词？"));
  children.push(heading4("1.1 一个对比实验"));
  children.push(p("让我们用同一个问题，对比\"没有提示词\"和\"有提示词\"的效果差异："));
  children.push(emptyLine());

  // 插图2-8
  children.push(imageSlot("2-8", "有/无提示词效果对比实验截图",
    "上下两栏对比。上栏\"无提示词\"：输入\"帮我写一个设计说明\"，AI输出一段空洞泛泛的内容（标红框）。下栏\"有提示词\"：输入完整的七要素提示词，AI输出结构清晰、内容具体的专业设计说明（标绿框）。重点标注差异之处。",
    "通栏，高度约14cm",
    "自行在AI中分别输入两种提示词并截图对比"));
  children.push(emptyLine());

  children.push(tipBox("结论", "同样是AI，给出的提示词不同，输出质量天差地别。提示词就是你与AI沟通的\"设计图纸\" -- 图纸越详细，成品质量越高。", "27AE60", "EAFAF1"));
  children.push(emptyLine());

  children.push(heading4("1.2 什么是提示词工程？"));
  children.push(p([
    { text: "提示词（Prompt）", bold: true },
    { text: "：你输入给AI的指令文本，包括问题、要求、背景信息等所有内容。" },
  ]));
  children.push(p([
    { text: "提示词工程（Prompt Engineering）", bold: true },
    { text: "：通过优化提示词的内容和结构，让AI产出更高质量内容的方法论。简单来说：提示词工程 = 学会\"说话\"让AI更好地为你工作。" },
  ]));
  children.push(emptyLine());

  // 二、提示词七要素
  children.push(heading3("二、提示词七要素"));
  children.push(heading4("2.1 七要素总览"));
  children.push(emptyLine());

  // 插图2-9
  children.push(imageSlot("2-9", "提示词七要素关系图",
    "以\"事项\"为中心的环形图/花瓣图，周围六个要素环绕：角色、背景、要求、样式、风格、结构。每个要素用不同颜色，配简要说明和建筑场景示例。中心标注\"角背事要 样风结\"记忆口诀。",
    "半栏（居中），高度约10cm",
    "自行绘制信息图（PPT/Canva）"));
  children.push(emptyLine());

  children.push(makeTable(
    ["要素", "说明", "是否必需", "建筑场景示例"],
    [
      ["角色", "给AI设定一个专业身份", "推荐", "\"你是一位注册建筑师\""],
      ["背景", "提供项目或任务的背景信息", "推荐", "\"这是一个乡村振兴项目\""],
      ["事项", "明确要AI做什么", "必需", "\"撰写设计说明书\""],
      ["要求", "具体的质量和内容要求", "推荐", "\"包含设计理念、空间分析\""],
      ["样式", "输出的格式和排版要求", "可选", "\"用Markdown格式，分章节\""],
      ["风格", "语言风格和表达方式", "可选", "\"语言正式专业，适合评审\""],
      ["结构", "输出的整体框架", "可选", "\"分为五个部分：总述、各论...\""],
    ],
    [1200, 2400, 1200, 3226]
  ));
  children.push(emptyLine());

  children.push(tipBox("记忆口诀", "角背事要，样风结（角色-背景-事项-要求-样式-风格-结构）", "8E44AD", "F5EEF8"));
  children.push(emptyLine());

  // 2.2 要素详解
  children.push(heading4("2.2 要素详解与示例"));
  children.push(emptyLine());

  children.push(p([{ text: "要素一：角色（Role）", bold: true, size: 26 }]));
  children.push(p("给AI一个明确的身份定位，让它从特定的专业视角回答问题。"));
  children.push(emptyLine());

  children.push(p([{ text: "为什么角色很重要？", bold: true }], { text: "因为同一个问题，不同角色的回答侧重点完全不同：" }));
  children.push(makeTable(
    ["角色", "问\"如何设计一个好的学校入口？\""],
    [
      ["建筑师", "强调空间序列感、尺度把控、立面标识性"],
      ["规划师", "强调交通组织、人车分流、与城市道路的衔接"],
      ["室内设计师", "强调门厅氛围、展示功能、导视系统"],
      ["景观设计师", "强调入口广场、绿化配置、文化景观节点"],
    ],
    [2500, 6526]
  ));
  children.push(emptyLine());

  children.push(p([{ text: "要素二：背景（Context）", bold: true, size: 26 }]));
  children.push(p("提供必要的背景信息，让AI理解具体的项目语境。建筑设计高度依赖场地和环境条件，AI需要这些信息才能给出有针对性的建议。"));
  children.push(emptyLine());

  children.push(p([{ text: "要素三：事项（Task）", bold: true, size: 26 }]));
  children.push(p("明确告诉AI你要它做什么，用动词开头。常见事项动词：撰写、分析、对比、总结、设计、规划、评估、翻译、解释、列举、生成、优化、审查、推荐。"));
  children.push(emptyLine());

  children.push(p([{ text: "要素四：要求（Requirements）", bold: true, size: 26 }]));
  children.push(p("对输出内容的具体质量要求。包括字数要求、内容要求、专业要求、受众要求、数量要求等。"));
  children.push(emptyLine());

  children.push(p([{ text: "要素五：样式（Format）", bold: true, size: 26 }]));
  children.push(p("指定输出的排版格式，如表格、编号列表、Markdown格式等。"));
  children.push(emptyLine());

  children.push(p([{ text: "要素六：风格（Tone）", bold: true, size: 26 }]));
  children.push(p("指定语言的表达风格，如正式专业、通俗易懂、简洁干练、生动有趣、学术严谨等。"));
  children.push(emptyLine());

  children.push(p([{ text: "要素七：结构（Structure）", bold: true, size: 26 }]));
  children.push(p("预设输出的整体框架，例如指定章节结构和字数分配。"));
  children.push(emptyLine());

  // 三、提示词实战模板
  children.push(heading3("三、提示词实战模板"));
  children.push(heading4("3.1 通用模板"));
  children.push(codeBlock([
    "【角色】你是一位[专业身份]，擅长[专业领域]。",
    "",
    "【背景】[项目/任务的背景信息]",
    "",
    "【任务】请[具体动作][具体内容]。",
    "",
    "【要求】",
    "1. [要求1]",
    "2. [要求2]",
    "3. [要求3]",
    "",
    "【格式】[输出格式要求]",
    "",
    "【风格】[语言风格要求]",
  ]));
  children.push(emptyLine());

  children.push(heading4("3.2 建筑领域专用模板"));
  children.push(emptyLine());

  children.push(p([{ text: "模板A：设计说明书生成", bold: true, color: "2E75B6", size: 26 }]));
  children.push(codeBlock([
    "【角色】你是一位甲级设计院的资深建筑师/室内设计师/景观设计师。",
    "",
    "【项目信息】",
    "- 项目名称：____",
    "- 项目地点：____",
    "- 项目类型：____（住宅/商业/办公/学校/...）",
    "- 建筑面积/用地面积：____",
    "- 设计风格：____",
    "- 功能要求：____",
    "- 特殊要求：____",
    "",
    "【任务】请撰写本项目的设计说明书。",
    "",
    "【要求】",
    "1. 包含设计理念、总体布局、功能分区、空间设计、材料选型、色彩方案",
    "2. 引用相关设计规范",
    "3. 语言专业规范",
    "4. 字数____字",
  ]));
  children.push(emptyLine());

  children.push(p([{ text: "模板B：规范解读", bold: true, color: "2E75B6", size: 26 }]));
  children.push(codeBlock([
    "【角色】你是一位建筑设计规范审查专家。",
    "【任务】请解读以下规范条文：[粘贴条文内容]",
    "【要求】",
    "1. 用通俗易懂的语言解释每一条的含义",
    "2. 说明在实际设计中的注意事项",
    "3. 举出常见的违规案例",
    "【格式】每条按\"条文原文 -> 通俗解读 -> 注意事项 -> 常见问题\"输出",
    "",
    "*** 提醒：规范条号和内容以官方文件为准，AI解读仅供参考。",
  ]));
  children.push(emptyLine());

  children.push(p([{ text: "模板C：方案分析报告", bold: true, color: "2E75B6", size: 26 }]));
  children.push(codeBlock([
    "【角色】你是一位城乡规划专业的研究员。",
    "【背景】[项目背景和分析目的]",
    "【任务】请对以下项目/场地进行分析，撰写分析报告。",
    "【分析维度】",
    "1. 区位分析  2. 现状分析  3. SWOT分析",
    "4. 案例借鉴  5. 规划策略建议",
    "【要求】每个维度需具体数据支撑，字数2000-3000字",
  ]));
  children.push(emptyLine());

  children.push(p([{ text: "模板D：投标书摘要", bold: true, color: "2E75B6", size: 26 }]));
  children.push(codeBlock([
    "【角色】你是一位建筑设计投标经验丰富的技术总监。",
    "【项目信息】[招标项目的基本信息]",
    "【任务】请撰写本项目投标文件的技术摘要部分。",
    "【要求】突出设计亮点和创新点，语言简洁有力，字数500-800字",
  ]));
  children.push(emptyLine());

  // 四、优化技巧
  children.push(heading3("四、提示词优化技巧"));
  children.push(heading4("4.1 迭代优化法"));
  children.push(p("提示词不必一次写到完美，可以通过多轮对话逐步优化。"));
  children.push(emptyLine());

  // 插图2-10
  children.push(imageSlot("2-10", "提示词迭代优化过程示意图",
    "展示5轮对话的简化流程：第1轮（基本提示词，获得初步输出）-> 第2轮（\"加入材料选择细节\"）-> 第3轮（\"融入地域文化\"）-> 第4轮（\"调整为正式风格\"）-> 第5轮（\"输出最终版本\"）。用箭头连接，每轮标注修改要点。",
    "通栏，高度约6cm",
    "自行绘制流程图"));
  children.push(emptyLine());

  children.push(heading4("4.2 \"先思考再回答\"技巧"));
  children.push(p("对于复杂问题，可以要求AI先分析再输出。在提示词中加入\"在回答之前，请先思考以下几个方面...\"。"));
  children.push(emptyLine());

  children.push(heading4("4.3 提供示例（少样本学习）"));
  children.push(p("给AI一个你满意的范例，让它按照同样的风格和质量输出。"));
  children.push(emptyLine());

  children.push(heading4("4.4 让AI改进自己的提示词"));
  children.push(p("你甚至可以让AI帮你优化提示词：\"以下是我写的提示词，请帮我优化，让它能生成更高质量的内容\"。"));
  children.push(emptyLine());

  // ===== 第5课时 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2("第5课时  建筑专业文本生成实战"));
  children.push(emptyLine());

  children.push(tipBox(
    "章节导读",
    "前两课时我们学习了AI对话的基本方法和提示词工程的理论。本课时将进入实战环节，针对四个专业方向，实操演示如何用AI生成高质量的建筑专业文本。",
    "E67E22", "FEF5E7"
  ));
  children.push(emptyLine());

  // 四个实战
  const practices = [
    { title: "一、室内设计说明书生成", imgId: "2-11", imgTitle: "AI生成室内设计说明书 -- 完整对话截图", imgContent: "展示完整的提示词输入和AI输出效果：左侧为输入的七要素提示词（咖啡厅室内设计说明），右侧为AI输出的1500字设计说明全文。标注输出中的亮点（绿色）和需要修改的地方（红色）。" },
    { title: "二、城乡规划分析报告生成", imgId: "2-12", imgTitle: "AI生成乡村规划分析报告 -- 输出效果截图", imgContent: "展示AI生成的乡村振兴规划分析报告的部分内容截图，重点展示SWOT分析表格和规划策略部分。标注\"（规划假设数据）\"的位置。" },
    { title: "三、园林景观设计文本生成", imgId: "2-13", imgTitle: "AI生成园林景观设计文本 -- 输出效果截图", imgContent: "展示AI生成的口袋公园景观设计文本截图，重点展示植物配置表格（具体植物名称）和海绵城市设计要点。" },
    { title: "四、施工方案文本辅助编写", imgId: "2-14", imgTitle: "AI辅助施工方案编写 -- 输出效果截图", imgContent: "展示AI生成的外墙保温施工方案截图，重点展示施工工艺流程步骤和质量控制要点。标注需要核实的规范引用。" },
  ];

  practices.forEach(pr => {
    children.push(heading3(pr.title));
    children.push(emptyLine());
    children.push(imageSlot(pr.imgId, pr.imgTitle, pr.imgContent, "通栏，高度约10cm", "自行在AI中使用教材提供的提示词实际操作并截图"));
    children.push(emptyLine());
  });

  // AI输出评估要点
  children.push(heading3("五、文本生成的通用注意事项"));
  children.push(emptyLine());
  children.push(makeTable(
    ["注意事项", "说明"],
    [
      ["AI是助手，不是替代", "AI生成的文本是\"初稿\"，必须经过专业人员审核"],
      ["核实数据和规范", "AI可能编造数据和规范条号，务必人工核实"],
      ["注入专业判断", "结合实际项目情况修改AI的通用性建议"],
      ["保持原创性", "在AI初稿基础上加入个人思考和创意"],
      ["标注AI使用", "在学术场景中，按要求标注AI工具的使用"],
    ],
    [3000, 6026]
  ));
  children.push(emptyLine());

  // ===== 第6课时 =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2("第6课时  AI内容幻觉与信息验证"));
  children.push(emptyLine());

  children.push(tipBox(
    "章节导读",
    "经过前几课时的实操，你可能已经感受到AI的强大。但与此同时，你可能也发现了一个严重的问题：AI有时候会一本正经地胡说八道。这就是\"AI幻觉\"（AI Hallucination）。对于建筑行业而言，如果不加辨别地使用AI生成的内容，可能导致引用错误的规范条号、使用不存在的材料数据、甚至给出违反安全要求的建议。本课时将深入剖析AI幻觉的本质，并教你如何有效识别和应对。",
    "E67E22", "FEF5E7"
  ));
  children.push(emptyLine());

  children.push(heading3("一、什么是AI幻觉？"));
  children.push(p([{ text: "AI幻觉（AI Hallucination）", bold: true }, { text: "：AI生成的内容看起来合理、流畅、自信，但实际上包含虚假、错误或编造的信息。通俗来说：AI不会说\"我不知道\"，它宁可编一个听起来很像的答案。" }]));
  children.push(emptyLine());

  // 插图2-15
  children.push(imageSlot("2-15", "AI幻觉示意漫画/信息图",
    "趣味示意图：一个AI机器人自信满满地指着一本被标红叉的\"规范\"，旁边建筑师表情怀疑地拿着真正的规范文件对比。配文字\"AI说的有鼻子有眼，但未必是真的！\"。风格轻松幽默，适合高职学生。",
    "半栏（居中），高度约8cm",
    "用AI生成漫画风格插图，或请美术老师/学生绘制"));
  children.push(emptyLine());

  children.push(heading4("1.2 AI幻觉的表现形式"));
  children.push(makeTable(
    ["幻觉类型", "表现", "建筑领域举例"],
    [
      ["编造事实", "捏造不存在的数据、事件", "\"根据住建部统计...\"（数据可能是编的）"],
      ["虚构引用", "给出不存在的文献或规范条号", "\"依据GB50016第5.3.7条...\"（条号可能不存在）"],
      ["张冠李戴", "混淆不同事物的信息", "把安藤忠雄的作品说成扎哈的"],
      ["过度推断", "从有限信息得出不可靠结论", "缺乏依据的技术推荐"],
      ["自相矛盾", "前后说法不一致", "前说框架结构，后说剪力墙"],
    ],
    [2000, 3013, 4013]
  ));
  children.push(emptyLine());

  children.push(heading4("1.3 为什么AI会产生幻觉？"));
  children.push(p([{ text: "三个根本原因：", bold: true }]));
  children.push(bulletItemBold("训练数据有限：", "AI的知识来自训练数据，如果某方面数据不足，它就容易编造"));
  children.push(bulletItemBold("模式匹配而非理解：", "AI不理解建筑规范背后的工程逻辑，只是匹配文字模式"));
  children.push(bulletItemBold("\"自信\"的设计机制：", "AI被设计为给出完整流畅的回答，而不是说\"我不确定\""));
  children.push(emptyLine());

  // 二、建筑领域典型案例
  children.push(heading3("二、建筑领域典型幻觉案例"));
  children.push(emptyLine());

  // 插图2-16
  children.push(imageSlot("2-16", "建筑领域AI幻觉三大典型案例对比图",
    "三栏并排展示三个典型案例：1）编造规范条号（AI回答 vs 真实规范对比，错误处标红）；2）虚构项目案例（AI编造的项目信息 vs 网络搜索不存在的结果）；3）材料参数偏差（AI给出的数值 vs 实际检测报告数值）。",
    "通栏，高度约12cm",
    "自行在AI中制造典型幻觉案例并截图，与真实数据对比"));
  children.push(emptyLine());

  // 三、如何减少
  children.push(heading3("三、如何减少AI幻觉的影响？"));
  children.push(heading4("3.1 六个实用策略"));
  children.push(emptyLine());

  // 插图2-17
  children.push(imageSlot("2-17", "减少AI幻觉六大策略信息图",
    "六宫格或环形布局，展示六个策略：1-标注不确定信息、2-提供参考资料（RAG）、3-要求引用来源、4-交叉验证、5-限制发挥空间、6-人工审核清单。每个策略配图标和一句话说明。",
    "通栏，高度约8cm",
    "自行绘制信息图"));
  children.push(emptyLine());

  const strategies = [
    { title: "策略一：要求AI标注不确定信息", desc: "在提示词中加入：\"如果你对某些信息不确定，请明确标注[待核实]，不要编造数据。\"" },
    { title: "策略二：提供参考资料（RAG）", desc: "将规范原文粘贴给AI，要求它基于原文回答，不要超出原文内容范围。这是目前减少幻觉最有效的方法之一。" },
    { title: "策略三：要求引用来源", desc: "要求AI标注每个关键信息的来源（规范名称、条号或参考文献），如果无法确定来源，请说明。" },
    { title: "策略四：交叉验证", desc: "将同一个问题分别输入2-3个不同的AI工具，对比回答。一致则可信度较高，不同则需人工核实。" },
    { title: "策略五：限制AI的发挥空间", desc: "\"请仅基于以下已知信息回答，不要添加任何额外假设。\"" },
    { title: "策略六：人工审核清单", desc: "使用审核清单逐项检查AI生成内容中的规范条号、数据、案例、材料参数、技术方案和安全相关内容。" },
  ];

  strategies.forEach(s => {
    children.push(p([{ text: s.title, bold: true, color: "2E75B6" }]));
    children.push(p(s.desc));
    children.push(emptyLine());
  });

  // 人工审核清单表
  children.push(p([{ text: "人工审核清单：", bold: true }]));
  children.push(makeTable(
    ["审核项", "检查方法"],
    [
      ["规范条号是否正确", "对照规范原文逐一核实"],
      ["数据是否准确", "查阅官方统计数据或检测报告"],
      ["案例是否真实", "网络搜索核实项目是否存在"],
      ["材料参数是否可靠", "以材料供应商数据或检测报告为准"],
      ["技术方案是否可行", "请有经验的专业人员审核"],
      ["是否存在安全隐患", "重点核查涉及消防、结构安全的内容"],
    ],
    [3500, 5526]
  ));
  children.push(emptyLine());

  // 高风险领域
  children.push(heading4("3.2 特别警告：高风险领域"));
  children.push(tipBox(
    "高风险领域 -- 必须严格人工审核，绝不能直接使用AI生成内容",
    "- 结构计算和荷载数据\n- 消防设计和疏散计算\n- 建筑材料的力学和热工参数\n- 施工安全技术方案\n- 工程造价数据\n- 法律法规引用\n\n原则：涉及人身安全和法律责任的内容，AI只能辅助，不能决策。",
    "E74C3C", "FDEDEC"
  ));
  children.push(emptyLine());

  // 课堂练习
  children.push(heading3("四、课堂练习：找出AI回答中的错误"));
  children.push(p("以下练习由教师课前准备：使用AI生成包含幻觉的建筑专业文本，让学生找出错误。"));
  children.push(bulletItemBold("练习题1：", "AI对某建筑规范的解读（含虚构条号）"));
  children.push(bulletItemBold("练习题2：", "AI生成的建筑案例分析（含虚构项目信息）"));
  children.push(bulletItemBold("练习题3：", "AI生成的施工工艺描述（含不准确技术参数）"));
  children.push(emptyLine());

  children.push(tipBox("教师备课提示", "建议在课前用AI生成3-5段包含幻觉的建筑专业文本，标注好错误之处。这些\"有毒样本\"可以作为非常好的教学素材，既训练了学生的批判性思维，又加深了对AI局限性的认识。", "2E75B6", "EBF5FB"));
  children.push(emptyLine());

  // 实践课指导
  children.push(makeSep());
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(heading2("实践课指导（4课时）"));
  children.push(emptyLine());

  children.push(heading3("实践三：AI文字助手综合实操（第1-2课时）"));
  children.push(p([{ text: "实践目标：", bold: true }, { text: "熟练使用AI进行专业文本的学习、翻译、分析和写作" }]));
  children.push(emptyLine());

  const tasks = [
    { title: "任务1：AI辅助学习（30分钟）", items: ["选择本学期某门专业课中一个较难理解的知识点", "用AI进行学习辅助（至少5轮对话）", "记录AI解释中有用和不准确的部分", "提交：对话截图 + 学习心得（200字）"] },
    { title: "任务2：AI翻译与分析（30分钟）", items: ["找一篇专业相关的英文论文摘要", "用AI翻译并分析研究要点", "使用提示词模板，指定保留专业术语英文原文", "提交：翻译结果 + AI分析要点"] },
    { title: "任务3：提示词对比实验（30分钟）", items: ["选择一个题目（如\"为某咖啡厅撰写室内设计说明\"）", "分别用L1模糊提问、L3场景提问、L5完整七要素三种方式提问", "记录并对比三种输出", "提交：三种AI输出对比 + 分析总结（300字）"] },
    { title: "任务4：课堂分享（30分钟）", items: ["每组选1人展示本组最佳提示词和AI输出成果", "全班评选\"最佳提示词\""] },
  ];

  tasks.forEach(t => {
    children.push(p([{ text: t.title, bold: true, size: 26 }]));
    t.items.forEach(item => children.push(bulletItem(item)));
    children.push(emptyLine());
  });

  children.push(heading3("实践四：建筑专业文本生成实战（第3-4课时）"));
  children.push(p([{ text: "实践目标：", bold: true }, { text: "独立完成一份建筑专业文本的AI辅助生成、审核与修改" }]));
  children.push(emptyLine());

  children.push(p([{ text: "实践任务（根据专业方向选做一项）：", bold: true }]));
  children.push(makeTable(
    ["专业方向", "任务"],
    [
      ["城乡规划", "为一个假设的社区公园编写规划设计说明（1500字）"],
      ["建筑设计", "为一个假设的小型文化馆编写建筑设计说明（1500字）"],
      ["室内设计", "为一个假设的民宿客房编写室内设计说明（1500字）"],
      ["园林景观", "为一个假设的校园景观节点编写设计说明（1500字）"],
    ],
    [2500, 6526]
  ));
  children.push(emptyLine());

  // 评分标准
  children.push(p([{ text: "评分标准：", bold: true }]));
  children.push(makeTable(
    ["评分维度", "占比", "说明"],
    [
      ["提示词质量", "20%", "是否运用了七要素，提示词是否专业有效"],
      ["内容专业性", "30%", "设计说明的专业深度和准确性"],
      ["审核修改", "25%", "是否有效识别了AI幻觉并做了专业修改"],
      ["个人创意", "15%", "是否在AI基础上加入了个人思考"],
      ["格式规范", "10%", "文档格式是否整洁规范"],
    ],
    [2500, 1200, 5326]
  ));
  children.push(emptyLine());

  // 本章小结
  children.push(makeSep());
  children.push(heading3("本章小结"));
  children.push(makeTable(
    ["知识点", "核心内容"],
    [
      ["AI对话基础", "五个提问层次，角色扮演，格式指定，多轮深入"],
      ["提示词七要素", "角色、背景、事项、要求、样式、风格、结构"],
      ["专业文本生成", "设计说明、分析报告、景观文本、施工方案的模板与方法"],
      ["AI幻觉", "编造事实、虚构引用、张冠李戴等五种表现"],
      ["减少幻觉", "标注不确定、提供参考、交叉验证、限制发挥、人工审核"],
      ["核心原则", "AI是助手不是替代；涉及安全的内容必须人工审核"],
    ],
    [2500, 6526]
  ));
  children.push(emptyLine());

  // 提示词速查卡
  children.push(makeSep());
  children.push(heading3("提示词速查卡"));
  children.push(p("以下为本模块涉及的常用提示词模板，可撕下随身携带或扫码收藏至小程序。"));
  children.push(emptyLine());

  const cards = [
    { title: "卡片1：通用提问模板", lines: ["你是一位[专业身份]。", "[背景信息]", "请[具体任务]。", "要求：[列出要求]", "格式：[格式要求]"] },
    { title: "卡片2：设计说明生成模板", lines: ["你是一位[设计方向]资深设计师。", "项目名称：___  地点：___  面积：___", "设计风格：___  功能要求：___", "请撰写设计说明书，包含设计理念、空间布局、", "材料选择、色彩方案等内容。", "字数___字，语言专业规范。"] },
    { title: "卡片3：规范查询模板", lines: ["你是一位建筑规范审查专家。", "请解读[规范名称]中关于[具体内容]的规定。", "要求：通俗解读+设计注意事项+常见违规案例。", "*** 请标注不确定的条号，以便核实原文。"] },
    { title: "卡片4：案例分析模板", lines: ["你是一位[专业方向]研究人员。", "请从[维度1]、[维度2]、[维度3]等方面", "分析[项目/建筑名称]。", "要求：每个维度300字，配合具体数据和描述。"] },
  ];

  cards.forEach(c => {
    children.push(p([{ text: c.title, bold: true, color: "2E75B6" }]));
    children.push(codeBlock(c.lines));
    children.push(emptyLine());
  });

  children.push(tipBox("下一模块预告", "模块三将进入视觉世界 -- 学习用AI生成建筑效果图、室内渲染图和景观意向图，这是建筑AIGC应用中最令人兴奋的部分！", "2E75B6", "EBF5FB"));
  children.push(emptyLine());

  // 二维码
  children.push(imageSlot("2-18", "本章配套资源二维码",
    "包含两个二维码并排：1）\"扫码获取本章配套视频教程\"（链接小程序）；2）\"扫码获取提示词模板库\"（链接小程序提示词模板页）。",
    "半栏（居中），高度约5cm",
    "待小程序/公众号上线后生成二维码"));

  return children;
}

// ===== 生成文档 =====
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Microsoft YaHei", size: 24 },
      },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Microsoft YaHei", color: "1A5276" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Microsoft YaHei", color: "2E75B6" },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Microsoft YaHei", color: "2C3E50" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25CB", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "建筑AIGC通用教程", font: "Microsoft YaHei", size: 18, color: "999999" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "- ", font: "Microsoft YaHei", size: 18, color: "999999" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Microsoft YaHei", size: 18, color: "999999" }),
            new TextRun({ text: " -", font: "Microsoft YaHei", size: 18, color: "999999" }),
          ],
        })],
      }),
    },
    children: buildDocument(),
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/ypw/Documents/token_net/textbook/建筑AIGC通用教程_模块一二.docx", buffer);
  console.log("Word document generated successfully!");
  console.log("File: /Users/ypw/Documents/token_net/textbook/建筑AIGC通用教程_模块一二.docx");
  console.log("Size:", (buffer.length / 1024).toFixed(1), "KB");
});
