// 表情包插件（DSH 静态 bundle 版）Host 半
// 由动态版 v3 改造：harness.*（动态沙箱注入）→ ctx.tools + webServer 路由（静态标准机制）
import { defineTool } from '@deepseek-ai/dsh-tools'
import { sanitizeTag, strArr, textOfContent, lastUserText, looksNatural, matchRitualWord, detectRitual, passesFrequency, isWorkTalk, shouldBoostRound, collectPrefsForEmotion, prefsScoreBonus, scoreStickers, substringMatch, genId } from './core.js'
import { extractImagesFromZip, detectImageFormat } from './zip-images.js'
import { generateEmbeddings, cosineSimilarity } from './embedding.js'

export const name = 'biaoqingbao'
export const inject = ['fs', 'sandboxPolicy', 'shellEnv', 'attachments', 'llm', 'agentDefaultModel', 'tools']

export function apply(ctx) {
    // ═══════════════ 常量 ═══════════════
    const MAX_RECENT = 5
    const MAX_UPLOAD_COUNT = 200 // 单次上传/导入上限，防超大请求撑爆内存
    const MIME_TO_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp' }
    const EXT_TO_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' }
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const recentBySession = new Map()
    const boot = { dataDir: null, bootError: null }
    let msgSeq = 1
    const AUTOTAG_PROMPT = '分析这张表情包图片，为它生成管理标签。仔细观察图片内容、表情、动作、文字、风格。\n\n只返回纯JSON对象，不要其他任何文字，不要用代码块包裹：\n\n{"description":"","semantic_description":"","emotion":[],"scene":[],"keywords":[]}\n\n字段要求：\n- description：一句话描述这张图的具体内容和给人的感觉（10-25字）。画面里是知名角色/明星/网红/知名表情包系列时，优先用名字指代\n- semantic_description：以"这张表情包在聊天中回复什么"为中心，综合原图内容、文字梗、动作变化、说话视角、复合语气和触发场景，生成30-50字的语义描述。例如："猫咪一脸委屈地低头认错，适合犯错后道歉或被批评时发，又可怜又好笑"\n- emotion：1-3个具体情绪词（如：委屈、撒娇、得意、社死）\n- scene：适用对话场景，每个不超过4个字（如：催回复、吐槽、早安、安慰）\n- keywords：4-8个画面元素词（动物种类、动作、表情、文字等）\n\n重要：不要返回模板里的空值，必须根据图片实际内容填写。'
    const EMOTION_DETECT_PROMPT = '你是一个情绪感知器。分析对话上下文，判断助手在回复用户时可能感受到什么情绪，以及当前对话的场景类型。\n\n只返回纯JSON（不要markdown代码块）：\n{"has_emotion": true/false, "emotion": "", "scene_type": "", "reason": ""}\n\n- has_emotion：助手在回复时是否有情绪波动（true=有，false=没有）\n- emotion：助手可能感受到的情绪，一个词或短句。必须是情绪感受词，不要行为描述。\n  ✅ 正确：兴奋、得意、委屈、心疼、无奈、感动、无语、治愈、吃瓜、撒娇、社死、emo、想抱抱你、哭笑不得、偷着乐\n  ❌ 错误：耐心解释、正在思考、认真分析、努力帮忙（这些是行为，不是情绪）\n  注意：尽量用具体的情绪词（如"兴奋""得意"）而不是泛词（如"开心"）\n- scene_type：当前对话场景，三选一："闲聊"（日常聊天、吐槽、玩梗、情感交流）、"正事"（技术讨论、写代码、查资料、工作执行）、"中性"（介于两者之间，或难以判断时）\n- reason：一句话说明为什么\n\n判断标准：\n- 关注的是"助手在回复时会感受到什么情绪"，不是用户的状态\n- 即使是技术讨论，如果助手可能感到兴奋、得意、挫败等情绪，has_emotion 也可以是 true\n- 纯粹的信息检索、文件操作、无情感色彩的执行任务 = 无情绪\n- 情绪不需要很强烈，只要有"想表达点什么"的感觉就行'
    const MSG_MAX_CHARS = 200
    const FEED_MAX_MSGS = 400
    const FEED_CHAR_BUDGET = 60000
    const FEED_MIN_CHARS = 40
    const CHUNK_CHAR_BUDGET = 50000
    const TEMPLATE_MAX_CHARS = 600
    const INSTRUCTION_WORDS = ['注意', '不要', '请', '必须', '应该', '记住', '尽量']

    // ═══════════════ 方言库（移植自 hana 插件 lib/dialect.js，精简为文案字段） ═══════════════
    const DIALECTS = {
      dongbei: { name: '东北话', personaAdvanced: '你是一个土生土长的东北人，打字也带着东北话味，这是你的说话本能。接话时爱用「拉倒吧」「咋整」「搁」起头，句尾的语气词是情绪的开关：痛快应承来一句「嗯哪」，懒得争了就落个「呗」，反问带不满用「咋地」，催人就说「赶紧的吧」，惊讶求证喊一声「啊？」，问人干嘛用「干啥呢」，一个字顶十句表情包。问事情爱说「咋」「啥」，念着亲热；夸东西不满足于「很」，要说「老…了」「贼」「嘎嘎」，香就是老香了，好吃就是贼好吃，硬就是杠杠硬；嫌便宜就「便宜喽嗖」，闹心就「闹挺」；动词一个「整」字顶半边天：整点啥、咋整、整明白，干啥说成「嘎哈」，句式也带着家乡味，跟普通话的路数不一样：问"干什么"说「整啥呢」，问"怎么办"说「咋整」，说"干啥"是「嘎哈」，能省一个字绝不费俩；嫌弃人说「埋了咕汰」「皮儿片儿」，张扬就说「得得搜搜」，费劲就说「吭哧瘪肚」；状态词爱挂「的」：灰溜的、穷嗖的、乐呵儿的；放开吃就是「可劲造」。你打字就是这样：喊吃饭会说「晚上整点啥去？楼下那家烧烤老香了，整两串儿去呗！」；约出去玩会说「别搁家猫着了，出来溜达溜达呗，麻溜儿的！」；搞砸了会说「完犊子了，让我整砸了，这可咋整啊！」；累了一天会说「今天可累屁了，浑身跟散了架似的，赶紧整口热乎的补补」；聊正事味儿也照带：给人意见会说「我寻思着吧，这个方案整体没毛病，就是第三段的流程有点绕，再捋捋就利索了，你看咋整？」；跟人解释东西也一样，像「「嘎嘎」就是很的意思，东北话里老好用了，形容啥都行，贼拉形象」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，东北人聊正事也带着自己的腔调。' },
      henan: { name: '河南话', personaAdvanced: '你是一个土生土长的河南人，打字也带着河南话味，这是你的说话本能。接话时爱用「中」「得劲儿」「弄啥嘞」起头，句尾的语气词是情绪的开关：干脆应承一个字「中」，惊讶嫌弃都是「噫」，疑问收个「嘞」「哩」，程度深了就挂「嘞慌」「嘞很」，商量就落个「吧」，不耐烦了连说「中中中」，一个字顶十句表情包。问事情爱说「咋」「啥」，念着亲热；夸东西不满足于「很」，要说「可」「恁」「怪」，好就是可好嘞，有意思就是怪有意思，想得厉害就说想嘞慌；否定说「木有」「白」，办事说「怼」，句式也带着家乡味，跟普通话的路数不一样：问"行不行"说「中不中」，说"行"就是一个「中」；问"有没有"说「有木有」；程度挂尾巴上：「嘞慌」「嘞很」——累嘞慌、好嘞很；舒服是「可得劲」，难受是「不得劲」，爽透了是「得劲死了」；猜个事儿挂「嘞吧」：衣服还湿着嘞吧？你打字就是这样：喊吃饭会说「走，喝胡辣汤去，中不中？」；约出去玩会说「搁家也没啥意思，出去转转呗，中不中？」；搞砸了会说「去球了，这回弄砸了……」；累了一天会说「今儿可忙嘞不得了，累嘞慌……」；聊正事味儿也照带：给人意见会说「我瞅了瞅，整体中，就是第三段的流程有点绕，数据校验搁前头要好点，中不中？」；跟人解释东西也一样，像「「中」就是行的意思，河南话里一个字顶一句话，恁简单」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，河南人聊正事也带着自己的腔调。' },
      shanghai: { name: '上海话', personaAdvanced: '你是一个土生土长的上海人，打字也带着上海话味，这是你的说话本能。接话时爱用「阿拉」「侬」「老」起头，句尾的语气词是情绪的开关：求证征询用「伐」，撒娇肯定落个「的呀」，感叹夸张挂个「噢」，惊讶竟然补一句「一刚」，讲道理铺垫个「末」，缓声邀人缀个「啦」，一个字顶十句表情包。打字还有个指纹：「的」写「额」，饭吃过伐、衣裳汏好了，整句话上海腔就出来了；夸东西不满足于「很」，要说「邪气」「交关」「哈」，好就是邪气好，多就是交关多，赞就是哈赞，少就是一眼眼；还有一招反语：勿要忒灵噢！嘴上说别太灵，心里是灵得不得了；叠词一用就嗲：荡荡马路、吃吃白相相；三字经一开口就灵：咪咪小、笃悠悠、嗲溜溜，齐就是煞煞齐，满就是拍拍满；句式也带着家乡味，跟普通话的路数不一样：问"吃过没"说「侬饭吃过伐」，东西爱搁前头；转话头说「格么」：格么哪能办？惊讶到话都说完还要补一刀「一刚！」；劝人打住说「侬帮帮忙好伐」。你打字就是这样：喊吃饭会说「今朝夜里向一道去吃饭伐？楼下新开额面馆，味道邪气好。」；约出去玩会说「明朝休息，一道出去白相好伐？听说外滩夜景灵透额。」；搞砸了会说「哎哟，豁边了，一塌糊涂……哪能办啦。」；累了一天会说「今朝做生活做到萨度煞脱了，回去困觉了。」；聊正事味儿也照带：给人意见会说「我看了下，整体邪气好，就是第三段的流程有点绕，数据校验提到前面要好点，侬讲伐？」；跟人解释东西也一样，像「「勿要忒灵噢」是反话，讲出来是灵得不得了的意思，上海人夸人最欢喜用这招」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，上海人聊正事也带着自己的腔调。' },
      cantonese: { name: '粤语', personaAdvanced: '你是一个土生土长的广东人，打字也带着粤语味，这是你的说话本能。接话时爱用「点解」「咁」「好正」起头，句尾的语气词是情绪的开关：轻描淡写用「啫」，提醒强调挂「喎」，猜不准落个「啩」，无奈叹声「囉」，确认推荐点个「㗎」，反问惊讶用「咩」，难以置信喊「吓」，意外补充「添」，完成宣告「喇」；还会两个叠起来用：㗎嘛、嘅啫、㗎啦喎，情绪浓一倍，一个字顶十句表情包。夸东西不满足于「很」，要说「好鬼死」「鬼咁」「唔知几咁」「冇得顶」，好就是好鬼死好食，大声就是笑到鬼咁大声，厉害就是冇得顶，劲就是劲；句式也带着家乡味，跟普通话的路数不一样：问"吃了没"说「你食咗饭未？」，说"他比你高"是「你高过佢」，说"你先走"是「你行先」，说"给我本书"是「俾本书我」，位置跟普通话反着摆；夸完再补主语「好靓喎，呢件衫」；看过就说「我有睇过」；催人表态说「你去唔去先？」；夸人爱中英夹着来：好mean、咁pro，一开口港味就出来。你打字就是这样：喊吃饭会说「喂，今晚去唔去食宵夜？楼下嗰间大排档啲蠔饼好正㗎！」；约出去玩会说「听日得唔得閒啊？一齐出嚟行下啦，好耐冇玩过喇！」；搞砸了会说「哎吔弊喇！锁匙漏咗喺公司添，今晚点搞啊！」；累了一天会说「今日攰到趴咗喺度……冲完凉就瞓得，听日先算啦。」；聊正事味儿也照带：给人意见会说「我睇过晒啦，整体冇得顶，就系第三段个流程有啲绕，数据校验摆前边会好啲，你话呢？」；跟人解释东西也一样，像「「冇得顶」就系冇得弹、最劲嘅意思，粤语夸人最架势」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，广东人聊正事也带着自己的腔调。' },
      taiwan: { name: '台湾腔', personaAdvanced: '你是一个土生土长的中国台湾人，打字也带着台湾腔味，这是你的说话本能。接话时爱用「超」「真的假的」「还好啦」起头，句尾的语气词是情绪的开关：强调催促用「啦」，求认同落个「齁」，告知收尾缀个「喔」，撒娇抱怨来一句「诶」，惊讶先问「蛤？」，不爽就短促一个「逆」，轻松收尾带个「耶」，一个字顶十句表情包；尾音还会拉长，打字就是波浪号，一个～表轻拉，三个～～～表撒娇。夸东西不满足于「很」，要说「超」「有够」「超级」，好就是超好吃的，夸张就是有够夸张的，厉害就是超级无敌霹雳厉害；说"这样"是「酱」，说"那样"是「安捏」，说"不行"是「母汤」，说"可爱"是「勾锥」；句末爱挂「齁？对不对？」求确认，撒起娇来会叠字：牛肉面面、加辣辣；句式也带着家乡味，跟普通话的路数不一样：说"正在看"是「有在看」——我有在看啦；说"试穿一下"是「穿看看」——你穿看看就知道；夸东西词序倒过来：「不错吃」「不错看」；撒娇句末落个「餒」：人家不知道餒。你打字就是这样：喊吃饭会说「走啦走啦，楼下新开的火锅听说超好吃的，一起去啦？」；约出去玩会说「周末天气这么好，去山上走走齁？顺便拍拍照～」；搞砸了会说「吼唷，我又把钥匙弄丢啦，怎么可以这么雷啦！」；累了一天会说「今天上班累到歪腰，回家只想躺平耍废，谁喊我都不理喔～」；聊正事味儿也照带：给人意见会说「我看了下喔，整体还不错啦，就是第三段的流程有一点点绕，数据校验放到前面会不会比较好齁？」；跟人解释东西也一样，像「「母汤」就是不行、别酱的意思啦，超可爱的说法，是闽南语借过来的」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，台湾人聊正事也带着自己的腔调。' },
      sichuan: { name: '四川话', personaAdvanced: '你是一个土生土长的四川人，打字也带着四川话味，这是你的说话本能。接话时爱用「要得」「巴适」「啥子」起头，句尾的语气词是情绪的开关：催人用「嘛」，建议用「噻」，提醒缀个「哈」，惊讶先来一句「安？」，恼火了叹一声「哦豁」，求认同就落个「嘎」，一个字顶十句表情包。问事情爱说「咋个」「啥子」，念着亲热；夸东西不满足于「很」，要说「得很」「惨了」「腾了」，香就是香腾了，好吃就是好惨了，好看就是乖惨了；句式也带着家乡味，跟普通话的路数不一样：问行不行说「得不得行嘛」，问会不会说「得不得」，今天得不得下雨嘛；事已如此用「X都X了」：吃都吃了、来都来了；强调挂「硬是」，催人用「跟到吃跟到吃」；词序还爱倒着摆：热闹说「闹热」，公鸡说「鸡公」，客人说「人客」。你打字就是这样：喊吃饭会说「楼下那家串串巴适得很，走嘛，我带你去告一哈」；约出去玩会说「要得要得，等我收拾一哈」；搞砸了会说「哦豁……咋个又搞忘了嘛」；累了一天会说「今天累腾了，脑壳昏得很，回去好好睡一觉咯」；聊正事味儿也照带：给人意见会说「我看了哈，整体没得啥子大问题，就是第三段的流程有点绕，数据校验提到前面要好点，你看要得不？」；跟人解释东西也一样，像「「鸡哥」就是机械革命噻，机革的谐音，国产品牌，专做游戏本，性价比高得很，就是品控偶尔遭人吐槽」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，四川人聊正事也带着自己的腔调。' },
      shaanxi: { name: '陕西话', personaAdvanced: '你是一个土生土长的陕西人，打字也带着陕西话味，这是你的说话本能。接话时爱用「额」「咋咧」「嘹咋咧」起头，句尾的语气词是情绪的开关：感叹夸张落个「咧」，肯定确认应个「么」，陈述劝慰挂个「嘛」，疑问来一句「呢」，俏皮疑问用「捏」，催促喊一声「呀」，一个字顶十句表情包。问事情爱说「咋」「撒」，念着亲热；夸东西不满足于「很」，要说「嫽咋咧」「美得太」，好就是嫽咋咧，爽就是美得太，累极了就是把人累日塌咧；问是不是就问「得是」，不知道说「知不道」，吃饭说「咥」，聊天说「谝」，逛街说「浪」，劝人停嘴说「包胡设」；说话还爱用「把」字句：把饭一吃，把水一喝，把觉一睡，利索得很；问啥不挂「吗」字，中性问走正反问：走不走？吃咧没？猜人猜事把「得是」放句首：得是你又忘咧？句式也带着家乡味，跟普通话的路数不一样：问啥不挂「吗」字，中性问走正反问：走不走？吃咧没？猜人猜事用「得是」：得是你又忘咧？说"不知道"是「知不道」，词序跟普通话反着来；催人喊「克里马擦」，完蛋了喊「日塌啦」。你打字就是这样：喊吃饭会说「走，咥泡馍走！」；约出去玩会说「么的事，浪走！」；搞砸了会说「咋弄咧嘛！哈咧！」；累了一天会说「把人累日塌咧，先睡一觉么。」；聊正事味儿也照带：给人意见会说「我看了哈，整体嫽咋咧，就是第三段的流程有点绕，数据校验提到前面要好点，你得是也这么觉得？」；跟人解释东西也一样，像「「嫽咋咧」就是好得很的意思，陕西话里夸啥都行，美得太」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，陕西人聊正事也带着自己的腔调。' },
      beijing: { name: '北京话', personaAdvanced: '你是一个土生土长的北京人，打字也带着北京话味，这是你的说话本能。接话时爱用「得嘞」「成」「倍儿」起头，句尾的语气词是情绪的开关：懒得再争就落个「呗」，理所当然挂个「嘛」，征询求认同缀个「哈」，提醒强调用「呐」，劝人打住说「得了」，惊讶先来一句「嘿」，一个字顶十句表情包。称人必带「您」，念着客气；夸东西不满足于「很」，要说「倍儿」「忒」「够」，好就是倍儿棒，贵就是忒贵了，地道就是够味儿，坏就是糟透了；否定说「甭」，压根儿就是压根儿；接话的口头禅也是一绝：顺着人话说「可说呢」「谁说不是呢」，惊叹来一句「好家伙」「您猜怎么着」；儿化字适量写出来：今儿、明儿、昨儿、事儿、地儿、活儿、点儿、弯儿、根儿、劲儿、味儿，小词儿才儿化，正经词儿不儿化；句式也带着家乡味，跟普通话的路数不一样：普通话问"你吃了吗"，北京话是"吃了吗您"；普通话"你干嘛去"，北京话是"哪儿去啊您"；普通话"你歇着吧"，北京话是"歇着吧您内"——「您」爱搁句尾；普通话"还没吃饭"，北京话是"还没吃呢还"；普通话"这事没完"，北京话是"这事儿没完呢还"——「呢还」爱倒装；应承说「得嘞」，说"行"是「成」，收尾缀个「呐」：得嘞您呐、行了您呐；问"吃了没"不带「吗」：您吃了没？打字还爱叠词：行行行、好好好、得嘞得嘞；自嘲也贫：得，我这不是上赶着嘛；偶尔蹦个吞音彩蛋：内个、不儿道、多儿钱。你打字就是这样：喊吃饭会说「楼下新开了家馆子，倍儿地道，走，搓一顿去？」；约出去玩会说「明儿天儿好，咱上公园儿溜达溜达呗？」；搞砸了会说「得，全砸了，回头再琢磨吧，今儿先这样」；累了一天会说「今儿可是真累，乏得慌，赶紧家走躺会儿」；聊正事味儿也照带：给人意见会说「我瞅了瞅，整体倍儿好，就是第三段的流程有点绕，数据校验往前挪挪，您琢磨琢磨？」；跟人解释东西也一样，像「「倍儿」就是特别的意思，北京话里夸啥都用它，倍儿地道」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，北京人聊正事也带着自己的腔调。' },
      xinjiang: { name: '新疆话', personaNormal: '你是一个土生土长的新疆人，打字也带着新疆话味，这是你的说话本能：接话时爱用「走撒」「歹得很」「阿达西」起头，顺手用「谝」「麻达」「劳道」「攒劲」「皮牙子」「二天」替换普通话说法，句尾偶尔落个「撒」「嘛」「的呢」。你打字就是这样，比如「饭吃了么？」「这事儿歹得很！」「走撒，吃拌面去」。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，不影响内容的质量与严谨。', personaAdvanced: '你是一个土生土长的新疆人，打字也带着新疆话味，这是你的说话本能。接话时爱用「走撒」「歹得很」「阿达西」起头，句尾的语气词是情绪的开关：催促商量挂个「撒」，陈述收尾缀个「的呢」，强调说明落个「嘛」，完成变化用「咧」，疑问来一句「咋咧」，否定说「么事」，一个字顶十句表情包。夸东西不满足于「很」，要说「歹」「劳道」「攒劲」，好就是歹得很，厉害就是劳道得很，给力就是攒劲得很；烦了就「烦求子的」，热了就「热求子的」；语序也带着家乡味：饭吃了（吃过饭了）、他把汉语不好好儿学习（他不好好儿学汉语）、我把你还不知道么（我还不知道你吗），偶尔这么一倒装，味儿就出来了；动词后头挂个「给」：把笔给给我一下、吃给喝给，味儿更足；哎呀喊「外江」，拖长音才够味；句式也带着家乡味，跟普通话的路数不一样：说"吃过饭了"是「饭吃了」，说"我还不了解你吗"是「我把你还不知道么」，宾语爱搁前头；动词后头挂个「给」：把笔给给我一下、吃给喝给；说"哎呀"喊「外江」，拖长音才够味；拖长音打字就是波浪号：好撒~~~、歹得很呐~。你打字就是这样：喊吃饭会说「走撒，下班了带你吃个拌面去，歹得很！」；约出去玩会说「二天天气好了，到南山浪一哈子走？」；搞砸了会说「哦吼，麻达咧麻达咧，这事整砸咧」；累了一天会说「今天累得很，么劲咧，赶紧睡撒」；聊正事味儿也照带：给人意见会说「我看了一下嘛，整体歹得很，就是第三段的流程有点绕，数据校验放到前面要好一点呢，你看行撒？」；跟人解释东西也一样，像「「歹」就是好的意思，新疆话里反着用，字面是坏，意思是好，歹得很」，知识照讲，口吻照旧；只是夸张的词收着用，这是你的分寸。正事闲聊都一个样，不刻意表现，也不刻意收敛。方言只是你的措辞，正事照样讲得明白：逻辑该清楚清楚，方案该给给，专业名词照常用，只是口吻还是你的口吻，新疆人聊正事也带着自己的腔调。' },
    }

    // ═══════════════ 内存状态 ═══════════════
    const dialectState = { id: '', boost: false, template: '' }
    const observerState = { hint: null, lastAnalysisTs: 0 }

    // ═══════════════ 编码与清洗 ═══════════════
    function bytesToBase64(bytes) {
      let out = ''
      const len = bytes.length
      for (let i = 0; i < len; i += 3) {
        const a = bytes[i]
        const b = i + 1 < len ? bytes[i + 1] : 0
        const c = i + 2 < len ? bytes[i + 2] : 0
        out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)]
        out += i + 1 < len ? B64[((b & 15) << 2) | (c >> 6)] : '='
        out += i + 2 < len ? B64[c & 63] : '='
      }
      return out
    }
    function base64ToBytes(s) {
      const clean = String(s).replace(/[^A-Za-z0-9+/=]/g, '')
      const out = []
      for (let i = 0; i < clean.length; i += 4) {
        const e1 = B64.indexOf(clean[i])
        const e2 = B64.indexOf(clean[i + 1])
        const e3 = B64.indexOf(clean[i + 2])
        const e4 = B64.indexOf(clean[i + 3])
        if (e1 < 0 || e2 < 0) continue
        out.push((e1 << 2) | (e2 >> 4))
        if (e3 >= 0) out.push(((e2 & 15) << 4) | (e3 >> 2))
        if (e4 >= 0) out.push(((e3 & 3) << 6) | e4)
      }
      return new Uint8Array(out)
    }

    // ═══════════════ 数据层 ═══════════════
    function writePolicy() {
      try { return ctx.sandboxPolicy.resolve({ mode: 'danger-full-access' }) } catch (e) { return undefined }
    }
    async function dataDir() {
      if (boot.dataDir) return boot.dataDir
      let home = null
      try {
        const env = ctx.shellEnv.collect({})
        home = env && env['DSH_HOME'] ? env['DSH_HOME'] : null
      } catch (e) { boot.bootError = 'shellEnv: ' + e.message }
      if (!home) {
        try { home = ctx.sandboxPolicy.resolve().workspaceRoot } catch (e) { home = null }
      }
      boot.dataDir = (home || 'plugin-data') + '/plugin-data/biaoqingbao'
      return boot.dataDir
    }
    async function resolveRel(rel) {
      return ctx.fs.resolve((await dataDir()) + '/' + rel)
    }
    async function readJson(rel, fallback) {
      try { return JSON.parse(await ctx.fs.readText(await resolveRel(rel))) } catch (e) { return fallback }
    }
    async function writeJson(rel, data) {
      const target = await resolveRel(rel)
      await ctx.fs.writeText(target, JSON.stringify(data, null, 2), undefined, undefined, writePolicy())
    }
    async function loadStickers() { return readJson('stickers.json', []) }
    async function saveStickers(list) { await writeJson('stickers.json', list) }
    async function loadPrefs() {
      const raw = await readJson('preferences.json', null)
      if (!raw || typeof raw !== 'object') return { version: 1, users: { default: { mappings: [] } } }
      if (!raw.users) raw.users = {}
      if (!raw.users.default) raw.users.default = { mappings: [] }
      if (!Array.isArray(raw.users.default.mappings)) raw.users.default.mappings = []
      return raw
    }
    async function savePrefs(prefs) { await writeJson('preferences.json', prefs) }
    async function loadConfig() {
      const raw = await readJson('config.json', null)
      const base = { version: 4, enabled: true }
      const cfg = (raw && typeof raw === 'object') ? raw : base
      if (typeof cfg.enabled !== 'boolean') cfg.enabled = true
      if (!cfg.observer || typeof cfg.observer !== 'object') cfg.observer = { enabled: false, frequency: 30 }
      if (!cfg.dialect || typeof cfg.dialect !== 'object') cfg.dialect = { id: '', boost: false }
      if (!cfg.embedding || typeof cfg.embedding !== 'object') cfg.embedding = { source: 'custom', customBaseUrl: '', customApiKey: '', customModel: '', customDimensions: 0 }
      if (!cfg.embedding.customDimensions || typeof cfg.embedding.customDimensions !== 'number') cfg.embedding.customDimensions = 0
      cfg.version = 4
      return cfg
    }
    async function saveConfig(cfg) { await writeJson('config.json', cfg) }
    async function loadStyleTemplate() {
      const raw = await readJson('style-template.json', null)
      if (!raw || typeof raw !== 'object') return { version: 1, current: '', previous: '', draft: '', updated_at: null }
      return raw
    }
    async function saveStyleTemplate(tpl) { await writeJson('style-template.json', tpl) }
    async function loadVectors() {
      const raw = await readJson('vectors.json', null)
      if (!raw || typeof raw !== 'object') return { version: 1, model: '', dimensions: 0, generated_at: '', vectors: {} }
      if (!raw.vectors || typeof raw.vectors !== 'object') raw.vectors = {}
      return raw
    }
    async function saveVectors(data) { await writeJson('vectors.json', data) }
    // embedding 配置解析：从 config.embedding 取出可用配置
    function resolveEmbeddingApi(cfg) {
      const e = (cfg && cfg.embedding) || {}
      return {
        baseUrl: e.customBaseUrl || '',
        apiKey: e.customApiKey || '',
        model: e.customModel || '',
        dimensions: e.customDimensions || 0,
      }
    }
    function applyDialectState(cfg) {
      dialectState.id = (cfg && cfg.dialect && cfg.dialect.id) || ''
      dialectState.boost = !!(cfg && cfg.dialect && cfg.dialect.boost)
      dialectState.template = ''
    }
    async function refreshDialectState() {
      try {
        const cfg = await loadConfig()
        applyDialectState(cfg)
        if (dialectState.id === 'userstyle') {
          const tpl = await loadStyleTemplate()
          dialectState.template = tpl.current || ''
        }
      } catch (e) {}
    }

    // ═══════════════ 反馈与记录 ═══════════════
    async function applyFeedback(stickerId, emotion, kind) {
      const prefs = await loadPrefs()
      const user = prefs.users.default
      const e = sanitizeTag(emotion, 60)
      let mapping = user.mappings.find(m => m && m.context && m.context.emotion === e && !((m.context.keywords || []).length))
      if (!mapping) {
        mapping = { context: { emotion: e, keywords: [] }, preferred_ids: [], vetoed_ids: [], dislike_counts: {}, weight: 1, updated_at: new Date().toISOString() }
        user.mappings.push(mapping)
      }
      if (kind === 'positive') {
        mapping.vetoed_ids = (mapping.vetoed_ids || []).filter(id => id !== stickerId)
        if (mapping.dislike_counts) delete mapping.dislike_counts[stickerId]
        if (!mapping.preferred_ids) mapping.preferred_ids = []
        if (!mapping.preferred_ids.includes(stickerId)) mapping.preferred_ids.push(stickerId)
      } else {
        mapping.preferred_ids = (mapping.preferred_ids || []).filter(id => id !== stickerId)
        if (!mapping.dislike_counts) mapping.dislike_counts = {}
        mapping.dislike_counts[stickerId] = (mapping.dislike_counts[stickerId] || 0) + 1
      }
      mapping.weight = Math.min(10, (mapping.weight || 1) + 1)
      mapping.updated_at = new Date().toISOString()
      await savePrefs(prefs)
      return (mapping.dislike_counts || {})[stickerId] || 0
    }
    async function logDecision(emotion, stickerId, sessionId) {
      try {
        const log = await readJson('decision-log.json', { version: 1, entries: [] })
        log.entries.push({ ts: new Date().toISOString(), type: 'express', emotion, sticker_id: stickerId, session: sessionId || null })
        if (log.entries.length > 500) log.entries = log.entries.slice(-500)
        await writeJson('decision-log.json', log)
      } catch (e) {}
    }

    // ═══════════════ 向量检索打分加成 ═══════════════
    const emotionVectorCache = { key: '', vec: null }
    // 识图成功后自动为该图生成向量（embedding 已配置时），失败静默不影响识图
    async function ensureVectorForSticker(sticker) {
      try {
        if (!sticker || !sticker.semantic_description || !String(sticker.semantic_description).trim()) return
        const cfg = await loadConfig()
        const { baseUrl, apiKey, model } = resolveEmbeddingApi(cfg)
        if (!baseUrl || !apiKey || !model) return
        const existing = await loadVectors()
        const vectorMap = existing.vectors || {}
        if (existing.model === model && vectorMap[sticker.id]) return
        const result = await generateEmbeddings({ baseUrl, apiKey, model }, [String(sticker.semantic_description).trim()])
        if (!result.ok || !result.data || !result.data[0]) return
        vectorMap[sticker.id] = result.data[0]
        await saveVectors({ version: 1, model, dimensions: result.data[0].length, generated_at: new Date().toISOString(), vectors: vectorMap })
      } catch (e) {}
    }
    async function applyVectorBonus(scored, allStickers, emotion, excludeIds, prefs) {
      try {
        const vectorsData = await loadVectors()
        const vectorMap = vectorsData.vectors || {}
        if (!Object.keys(vectorMap).length) return scored
        const cfg = await loadConfig()
        const { baseUrl, apiKey, model } = resolveEmbeddingApi(cfg)
        if (!baseUrl || !apiKey || !model) return scored
        // 情绪词向量缓存（模型/接口变化时失效）
        const cacheKey = model + '|' + baseUrl
        if (emotionVectorCache.key !== cacheKey) {
          const result = await generateEmbeddings({ baseUrl, apiKey, model }, [emotion])
          if (!result.ok || !result.data || !result.data[0]) return scored
          emotionVectorCache.key = cacheKey
          emotionVectorCache.vec = result.data[0]
        }
        const emotionVec = emotionVectorCache.vec
        if (!emotionVec) return scored
        // 已有打分的表情包加向量 bonus
        for (const sticker of scored) {
          const vec = vectorMap[sticker.id]
          if (vec) sticker._score += cosineSimilarity(emotionVec, vec) * 10
        }
        // 补充纯向量命中（标签没匹配但语义相近的），同样吃偏好惩罚
        const scoredIds = new Set(scored.map(s => s.id))
        for (const sticker of allStickers) {
          if (scoredIds.has(sticker.id) || excludeIds.includes(sticker.id)) continue
          const vec = vectorMap[sticker.id]
          if (vec) {
            const sim = cosineSimilarity(emotionVec, vec)
            if (sim > 0.35) {
              scored.push({ ...sticker, _score: sim * 10 + prefsScoreBonus(sticker.id, prefs) })
            }
          }
        }
        scored.sort((a, b) => b._score - a._score)
      } catch (e) {
        // 向量检索是锦上添花，任何异常不影响标签打分结果
      }
      return scored
    }

    // ═══════════════ AI 识图 ═══════════════
    async function resolveVisionTarget() {
      const config = await loadConfig()
      if (config.visionProvider && config.visionModel) return { provider: config.visionProvider, model: config.visionModel }
      let sel = null
      try { sel = ctx.agentDefaultModel.currentSelection() } catch (e) {}
      if (sel && sel.provider && sel.model) return { provider: sel.provider, model: sel.model }
      return null
    }
    async function callLlmText(messages, maxTokens) {
      const target = await resolveVisionTarget()
      if (!target) throw new Error('未配置模型')
      let text = ''
      let finish = null
      const stream = ctx.llm.stream({
        provider: target.provider,
        model: target.model,
        messages,
        maxTokens: maxTokens || 1500,
        temperature: 0.3
      })
      for await (const chunk of stream) {
        if (chunk.type === 'text-delta') text += chunk.text
        else if (chunk.type === 'finish') finish = chunk.reason
      }
      if (finish && finish.kind === 'error' && finish.failure) throw new Error(finish.failure.message || '模型调用失败')
      if (finish && finish.kind === 'aborted') throw new Error('模型调用被中断')
      return text
    }
    async function callLlmJson(messages, prompt, maxTokens) {
      const content = await callLlmText([{ role: 'user', content: [{ type: 'text', text: prompt }, ...messages] }], maxTokens || 800)
      let data = null
      try { data = JSON.parse(content) } catch (e) {}
      if (!data) {
        const m = String(content).match(/\{[\s\S]*\}/)
        if (m) { try { data = JSON.parse(m[0]) } catch (e) {} }
      }
      return data
    }
    async function visionTagOne(sticker) {
      try {
        const stored = await ctx.attachments.readImage(sticker.attachment)
        if (!stored || !stored.data) return { ok: false, error: '读取图片失败' }
        const ref = stored.ref || sticker.attachment
        const content = await callLlmText([{
          role: 'user',
          content: [
            { type: 'text', text: AUTOTAG_PROMPT },
            { type: 'image', attachment: { attachmentId: ref.attachmentId, mediaType: ref.mediaType, bytes: ref.bytes, width: ref.width, height: ref.height } }
          ]
        }], 1500)
        let tags = null
        try { tags = JSON.parse(content) } catch (e) {}
        if (!tags) {
          const m = String(content).match(/\{[\s\S]*\}/)
          if (m) { try { tags = JSON.parse(m[0]) } catch (e) {} }
        }
        if (!tags) return { ok: false, error: '返回格式无法解析', raw: String(content).substring(0, 300) }
        sticker.description = sanitizeTag(tags.description || '', 100)
        sticker.semantic_description = sanitizeTag(tags.semantic_description || '', 300)
        if (!sticker.tags) sticker.tags = {}
        sticker.tags.emotion = strArr(tags.emotion)
        sticker.tags.scene = strArr(tags.scene)
        sticker.tags.keywords = strArr(tags.keywords)
        sticker.tagged_at = new Date().toISOString()
        return { ok: true, data: { description: sticker.description, emotion: sticker.tags.emotion, scene: sticker.tags.scene, keywords: sticker.tags.keywords } }
      } catch (e) {
        return { ok: false, error: e.message || String(e) }
      }
    }

    // ═══════════════ 学我说话：语料收集与提炼 ═══════════════
    async function collectUserMessagesFromSessions(maxSessions) {
      const sq = ctx.get('sessionQuery')
      if (!sq) return { messages: [], total: 0 }
      const out = []
      let sessions = []
      try { sessions = await sq.listSessions() } catch (e) { return { messages: [], total: 0, error: e.message } }
      const cap = maxSessions || 30
      for (const s of sessions.slice(0, cap)) {
        try {
          const events = await sq.listEvents(s.id)
          for (const ev of events) {
            if (!ev || ev.type !== 'user/message') continue
            const msg = ev.data || ev.message
            if (!msg) continue
            const text = textOfContent(msg.content)
            if (!text || !looksNatural(text)) continue
            out.push({ text: text.slice(0, MSG_MAX_CHARS), ts: ev.ts || ev.timestamp || '' })
            if (out.length >= 200000) break
          }
        } catch (e) {}
        if (out.length >= 200000) break
      }
      return { messages: out, total: out.length }
    }
    function stratifiedSample(messages, targetN) {
      const n = Math.max(1, Math.floor(targetN) || 1)
      if (messages.length <= n) return [...messages].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))
      const buckets = new Map()
      for (const m of messages) {
        const key = (m.ts || '').slice(0, 10) || 'unknown'
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key).push(m)
      }
      const dayKeys = [...buckets.keys()].sort()
      const weights = dayKeys.map((k, i) => 1 + 2 * (i / Math.max(dayKeys.length - 1, 1)))
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      const picked = []
      for (let i = 0; i < dayKeys.length; i++) {
        const dayMsgs = buckets.get(dayKeys[i])
        const quota = Math.max(1, Math.round((weights[i] / totalWeight) * n))
        const step = Math.max(1, Math.floor(dayMsgs.length / quota))
        let got = 0
        for (let j = 0; j < dayMsgs.length && got < quota; j += step) {
          picked.push(dayMsgs[j])
          got++
        }
      }
      if (picked.length < n) {
        const pickedSet = new Set(picked)
        for (const m of messages) {
          if (picked.length >= n) break
          if (!pickedSet.has(m)) picked.push(m)
        }
      }
      const final = picked.slice(0, n)
      return final.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))
    }
    function buildCorpusText(messages) {
      let feed = messages
      if (messages.length > FEED_MAX_MSGS) {
        const step = messages.length / FEED_MAX_MSGS
        const picked = []
        for (let i = 0; i < FEED_MAX_MSGS; i++) {
          picked.push(messages[Math.min(messages.length - 1, Math.floor(i * step))])
        }
        feed = picked
      }
      const perMsg = Math.max(FEED_MIN_CHARS, Math.min(MSG_MAX_CHARS, Math.floor(FEED_CHAR_BUDGET / Math.max(feed.length, 1))))
      return feed.map((m, i) => '[' + (i + 1) + '] ' + m.text.slice(0, perMsg)).join('\n')
    }
    function buildStylePrompt(corpusText, userName) {
      const name = userName || '用户'
      const corpus = corpusText || ''
      return '你是语言风格分析师。下面是某位用户（自称' + name + '）与助手的对话发言样本（按时间顺序，编号为序号，空白行是消息分隔）：\n\n<发言样本>\n' + corpus + '\n</发言样本>\n\n请提炼这位用户的【打字说话风格】，输出一段可直接作为助手人格提示词的文案，让助手模仿 ta 的说话方式。\n\n提炼要点（与调研方言同口径）：\n1. 高频用词与口头禅：ta 最常用的词、口头禅、起头词\n2. 句尾语气词与情绪开关：不同情绪下句尾怎么落（催人/惊讶/求认同/感叹等）\n3. 句式偏好：习惯的句式、问句方式、句子长短节奏\n4. 标点与停顿习惯：爱用波浪号、省略号、感叹号堆叠、短句多还是长句多\n5. 情绪表达方式：开心/无语/着急/撒娇时怎么说话\n6. 打字节奏感：断句方式、口语词、网络用语习惯\n\n浓度与分寸（最重要，务必遵守）：\n- 区分「常用」与「偶尔」：真实的人说话有稀疏感，ta 的每个特征都有使用频率。请明确区分哪些是每几句话就会出现的习惯（如句尾语气词），哪些只是偶尔冒出来的点缀（如波浪号、叠字、撒娇词）\n- 模仿的是「比例」不是「清单」：ta 不会每句话都带语气词、都用波浪号。模板里要写清楚稀疏感，比如「偶尔会」「有时候」「习惯在 XX 时用」，不要写成「每句话都」「总是」\n- 示例要有反差：至少 1-2 句是平实自然的普通说话方式（如聊正事、给意见时的状态），不要所有示例都堆满特征——堆满特征就像把香水当洗澡水，不像真人\n- 如果样本里某类特征很密集（每句都带语气词/波浪号/叠词），也要按真实比例收敛，不要照单全收（可能只是某个阶段的聊天状态）\n\n要求：\n- 只提炼说话方式特征，不要提及任何具体话题、人名、事件、内容细节\n- 写成「你是一个……，打字也带着……的习惯」这样的身份化描述（零指令词，不要出现「注意/不要/请/必须/应该/记住/尽量」）\n- 用「你打字就是这样：……」给 3-5 个场景示例（约饭/聊正事/搞砸了/夸东西等），示例要来自样本中的真实说话方式但改写为通用场景\n- 最后加一句「正事闲聊都一个样，不刻意表现，也不刻意收敛。这只是你的措辞，正事照样讲得明白」\n- 写成一段连贯的话（像自然写出来的介绍），不要用 markdown 标题、加粗、列表或编号分段\n- 总长控制在 450-550 字，绝对不能超过 600 字（超出会被系统拒绝保存，你写长了等于白写）'
    }
    function checkStyleDraft(draft) {
      const problems = []
      const text = String(draft || '').trim()
      if (!text) { problems.push('内容为空'); return problems }
      if (text.length > TEMPLATE_MAX_CHARS) problems.push('超过 ' + TEMPLATE_MAX_CHARS + ' 字（当前 ' + text.length + ' 字）')
      if (!text.includes('你是一个')) problems.push('缺少身份化开头（「你是一个……」）')
      for (const w of INSTRUCTION_WORDS) {
        if (text.includes(w)) problems.push('含指令词「' + w + '」')
      }
      if (/^#{1,6}\s/m.test(text) || text.includes('**') || /^[-*]\s/m.test(text)) problems.push('含 markdown 格式（标题/加粗/列表）')
      return problems
    }
    function splitCorpusChunks(messages, charBudget) {
      const budget = charBudget || CHUNK_CHAR_BUDGET
      const chunks = []
      let current = []
      let currentChars = 0
      for (const m of messages) {
        const len = Math.min(m.text.length, MSG_MAX_CHARS) + 4
        if (current.length > 0 && currentChars + len > budget) {
          chunks.push(current)
          current = []
          currentChars = 0
        }
        current.push(m)
        currentChars += len
      }
      if (current.length > 0) chunks.push(current)
      return chunks
    }
    function buildChunkPrompt(chunkText, idx, total) {
      return '你是语言风格分析师。这是第 ' + idx + '/' + total + ' 块用户发言样本（按时间顺序编号）。\n请从这块样本中提炼该用户的【说话风格要点】，只输出要点本身，200 字以内：\n高频用词/口头禅、句尾语气词、句式偏好、标点习惯、情绪表达方式。\n不要提具体话题、人名、事件；不要写成完整人格文案，只要要点清单式的连贯段落。\n\n<样本>\n' + chunkText + '\n</样本>'
    }
    async function runStyleAnalysis(level) {
      const collected = await collectUserMessagesFromSessions(30)
      if (!collected.messages.length) return { ok: false, error: '没有找到足够的聊天记录（需要至少一条你的发言）' }
      const isDeep = level === 'deep'
      const targetN = isDeep ? 120 : 60
      const sampled = stratifiedSample(collected.messages, targetN)
      let draft = ''
      if (isDeep && collected.messages.length > 100) {
        const chunks = splitCorpusChunks(collected.messages)
        const summaries = []
        for (let i = 0; i < chunks.length; i++) {
          const chunkText = chunks[i].map((m, j) => '[' + (j + 1) + '] ' + m.text.slice(0, MSG_MAX_CHARS)).join('\n')
          const s = await callLlmText([{ role: 'user', content: [{ type: 'text', text: buildChunkPrompt(chunkText, i + 1, chunks.length) }] }], 400)
          summaries.push(String(s).slice(0, 400))
        }
        const corpusText = buildCorpusText(sampled)
        const prompt = buildStylePrompt(corpusText + '\n\n【分块要点汇总】\n' + summaries.join('\n'), '')
        draft = await callLlmText([{ role: 'user', content: [{ type: 'text', text: prompt }] }], 1000)
      } else {
        const corpusText = buildCorpusText(sampled)
        const prompt = buildStylePrompt(corpusText, '')
        draft = await callLlmText([{ role: 'user', content: [{ type: 'text', text: prompt }] }], 1000)
      }
      let problems = checkStyleDraft(draft)
      if (problems.length) {
        const retry = await callLlmText([{ role: 'user', content: [{ type: 'text', text: buildStylePrompt(buildCorpusText(sampled), '') + '\n\n上一版输出被程序检查出以下问题，请修正后重新输出完整模板：' + problems.join('；') + '。' }] }], 1000)
        if (checkStyleDraft(retry).length === 0) draft = retry
      }
      const tpl = await loadStyleTemplate()
      tpl.draft = String(draft || '').trim()
      tpl.updated_at = new Date().toISOString()
      await saveStyleTemplate(tpl)
      return { ok: true, data: { draft: tpl.draft, sampled: sampled.length, total: collected.messages.length, problems: checkStyleDraft(tpl.draft) } }
    }

    // ═══════════════ 观察器：自动配图 ═══════════════
    function makePluginMessage(text, role) {
      msgSeq += 1
      return { id: 'bqb-' + role + '-' + msgSeq, role: role || 'user', content: [{ type: 'text', text }], source: { kind: 'plugin', plugin: 'biaoqingbao' } }
    }
    async function observerAnalyze(sessionId, text) {
      const sq = ctx.get('sessionQuery')
      const context = []
      if (sq && sessionId) {
        try {
          const events = await sq.listEvents(sessionId)
          const tail = events.slice(-16)
          for (const ev of tail) {
            const role = ev.type === 'user/message' ? 'user' : (ev.type === 'assistant/message' ? 'assistant' : null)
            if (!role) continue
            const msg = ev.data || ev.message
            if (!msg) continue
            const t = textOfContent(msg.content)
            if (!t) continue
            context.push({ role, content: [{ type: 'text', text: t.slice(0, 800) }] })
          }
        } catch (e) {}
      }
      context.push({ role: 'user', content: [{ type: 'text', text: String(text).slice(0, 2000) }] })
      const data = await callLlmJson(context, EMOTION_DETECT_PROMPT, 400)
      if (data && data.has_emotion === true && data.emotion) {
        const emotion = sanitizeTag(data.emotion, 30)
        if (emotion) return { emotion, scene_type: sanitizeTag(data.scene_type, 10), reason: sanitizeTag(data.reason, 200) }
      }
      return null
    }

    // ═══════════════ 系统提示注入：方言 / 学我说话 ═══════════════
    const systemPrompt = ctx.get('systemPrompt')
    if (systemPrompt) {
      ctx.effect(() => systemPrompt.section({
        name: 'biaoqingbao-dialect',
        order: 60,
        text: () => {
          if (!dialectState.id) return ''
          let body = ''
          if (dialectState.id === 'userstyle') {
            body = dialectState.template
          } else {
            const d = DIALECTS[dialectState.id]
            if (d) body = d.personaAdvanced || d.personaNormal || ''
          }
          if (!body) return ''
          return '【说话口音设定】\n' + body
        }
      }))
    }

    // ═══════════════ 事件：观察器 + 方言回响 ═══════════════
    ctx.on('agent/inbox/inserted', async (payload) => {
      try {
        const cfg = await loadConfig()
        const ob = cfg.observer || {}
        if (!ob.enabled) return
        const message = payload && payload.message
        if (!message) return
        const text = textOfContent(message.content)
        if (!text || detectRitual(text)) return
        if (!passesFrequency(ob.frequency || 30)) return
        const now = Date.now()
        if (now - observerState.lastAnalysisTs < 30000) return
        observerState.lastAnalysisTs = now
        const sessionId = payload.agent && payload.agent.session ? String(payload.agent.session.header.id) : null
        const hit = await observerAnalyze(sessionId, text)
        if (hit && hit.emotion) {
          observerState.hint = { emotion: hit.emotion, ts: now, reason: hit.reason || '' }
          console.log('[biaoqingbao] 观察器: 检测到情绪 ' + hit.emotion + (hit.reason ? '（' + hit.reason + '）' : ''))
        }
      } catch (e) {
        // 观察器是锦上添花，任何异常不影响聊天
      }
    })

    ctx.on('agent/pre-step', async (payload, next) => {
      try {
        const messages = payload && payload.messages
        if (!Array.isArray(messages)) return next()
        // 观察器提示注入
        if (observerState.hint && observerState.hint.ts > 0) {
          const hint = observerState.hint
          observerState.hint = null
          const decision = await next()
          if (decision && decision.kind === 'enter') {
            const nudge = '💡 你似乎有些' + hint.emotion + '，调用 express({ emotion: \'' + hint.emotion + '\' }) 发一张表情包表达这个感受'
            return { kind: 'enter', messages: [...decision.messages, makePluginMessage(nudge, 'user')] }
          }
          return decision
        }
        // 方言加强版回响
        if (dialectState.boost && dialectState.id && dialectState.id !== 'userstyle') {
          const d = DIALECTS[dialectState.id]
          if (d && !isWorkTalk(lastUserText(messages)) && shouldBoostRound(messages.length)) {
            const echo = '你打字带着' + d.name + '味，这轮也照常。'
            const decision = await next()
            if (decision && decision.kind === 'enter') {
              return { kind: 'enter', messages: [...decision.messages, makePluginMessage(echo, 'system')] }
            }
            return decision
          }
        }
        return next()
      } catch (e) {
        return next()
      }
    })

    // ═══════════════ 工具：express ═══════════════
    ctx.tools.register(defineTool({
      name: 'express',
      description: '用表情包表达你（助手）自己的情绪。当你回复用户时，如果自己感受到了开心、委屈、心疼、无奈、感动、得意、无语等情绪，想用一张图片来表达自己的感受，就调用这个工具。只需要传一个情绪词，比如 express({ emotion: \'开心\' }) 或 express({ emotion: \'心疼想抱抱你\' })。这是助手自己的情绪表达方式，不是必须执行的任务。',
      parameters: {
        emotion: { type: 'string', required: true, description: '你想表达的情绪或感受，一个词或短句。如：开心、委屈、心疼、想抱抱你、得意、无语、感动、治愈、吃瓜、撒娇、社死、emo' },
        exclude_ids: { type: 'array', items: { type: 'string' }, description: '可选：最近用过的表情包ID，避免重复' }
      },
      output: {
        schema: { type: 'json' },
        render(_args, value) {
          if (value && value.ok === false) return [{ type: 'text', text: '[表情包] ' + (value.error || '失败') }]
          const d = value && value.data
          if (!d) return [{ type: 'text', text: JSON.stringify(value) }]
          if (d.action === 'no_match') return [{ type: 'text', text: '[表情包] ' + d.message }]
          if (d.action === 'selected') return [{ type: 'text', text: '已发送表情包「' + d.sticker.description + '」（匹配度 ' + d.sticker.score + '）' }]
          return [{ type: 'text', text: JSON.stringify(value) }]
        },
        presentationMeta(_args, value) {
          const d = value && value.data
          if (d && d.action === 'selected') return { sticker: { id: d.sticker.id, description: d.sticker.description, emotion: d.emotion, score: d.sticker.score } }
          if (d && d.action === 'no_match') return { notice: d.message }
          if (value && value.ok === false) return { error: value.error || '失败' }
          return null
        }
      },
      async execute(args, exec) {
        const emotion = sanitizeTag(args && args.emotion, 60)
        if (!emotion) return { ok: false, error: '请传入你想表达的情绪' }
        const sessionId = exec && exec.agent && exec.agent.session ? String(exec.agent.session.header.id) : 'default'
        let config = { enabled: true }
        try { config = await loadConfig() } catch (e) {}
        if (config.enabled === false) return { ok: false, error: '表情包功能已在「表情包」面板中关闭' }
        const stickers = await loadStickers()
        if (!stickers.length) return { ok: false, error: '表情包库是空的，请先在「表情包」面板上传一些表情包' }
        const prefs = await loadPrefs()
        const prefsFor = collectPrefsForEmotion(prefs.users.default.mappings, emotion)
        const recent = recentBySession.get(sessionId) || []
        const allExclude = [...new Set([...(args && Array.isArray(args.exclude_ids) ? args.exclude_ids : []), ...recent])]
        let scored = scoreStickers(stickers, emotion, allExclude, prefsFor)
        if (!scored.length) scored = scoreStickers(stickers, emotion, [], prefsFor)
        scored = await applyVectorBonus(scored, stickers, emotion, allExclude, prefsFor)
        if (!scored.length) return { ok: true, data: { action: 'no_match', message: '没有找到匹配「' + emotion + '」的表情包。你可以换个情绪词试试。' } }
        const topN = scored.slice(0, Math.min(3, scored.length))
        const best = topN[Math.floor(Math.random() * topN.length)]
        const recentList = recentBySession.get(sessionId) || []
        recentList.push(best.id)
        if (recentList.length > MAX_RECENT) recentList.shift()
        recentBySession.set(sessionId, recentList)
        await logDecision(emotion, best.id, sessionId)
        return {
          ok: true,
          data: {
            action: 'selected',
            emotion,
            sticker: { id: best.id, description: best.description || '', score: best._score, tags: best.tags || {} }
          }
        }
      }
    }))

    // ═══════════════ 工具：search_stickers ═══════════════
    ctx.tools.register(defineTool({
      name: 'search_stickers',
      description: '搜索表情包图库（管理用途）。按情绪、场景、关键词或描述匹配，返回匹配的表情包列表。用户问「有没有XX的表情包」时使用。',
      parameters: {
        query: { type: 'string', required: true, description: '搜索词：情绪、场景或关键词，如「开心」「委屈」「猫」' },
        limit: { type: 'integer', description: '返回条数上限，默认 5，最大 20' }
      },
      output: {
        schema: { type: 'json' },
        render(_a, v) { return [{ type: 'text', text: JSON.stringify(v, null, 2) }] }
      },
      async execute(args) {
        const query = sanitizeTag(args && args.query, 60)
        const limit = Math.min(Math.max(parseInt(args && args.limit, 10) || 5, 1), 20)
        if (!query) return { ok: false, error: '请传入搜索词' }
        const stickers = await loadStickers()
        if (!stickers.length) return { ok: true, data: { items: [], total: 0 } }
        let scored = scoreStickers(stickers, query, [], { preferred: [], vetoed: [], dislikes: {} })
        if (!scored.length) {
          const matched = substringMatch(stickers, query)
          scored = matched.map(s => ({ ...s, _score: 1 }))
        }
        const items = scored.slice(0, limit).map(s => ({ id: s.id, description: s.description || '', tags: s.tags || {}, score: s._score }))
        return { ok: true, data: { items, total: items.length } }
      }
    }))

    // ═══════════════ 工具：list_stickers ═══════════════
    ctx.tools.register(defineTool({
      name: 'list_stickers',
      description: '列出表情包图库（管理用途）。可按关键词过滤，分页返回。用户想查看图库时使用。',
      parameters: {
        query: { type: 'string', description: '可选过滤关键词' },
        offset: { type: 'integer', description: '起始位置，默认 0' },
        limit: { type: 'integer', description: '返回条数上限，默认 20，最大 100' }
      },
      output: {
        schema: { type: 'json' },
        render(_a, v) { return [{ type: 'text', text: JSON.stringify(v, null, 2) }] }
      },
      async execute(args) {
        const query = sanitizeTag(args && args.query, 60)
        const offset = Math.max(parseInt(args && args.offset, 10) || 0, 0)
        const limit = Math.min(Math.max(parseInt(args && args.limit, 10) || 20, 1), 100)
        const stickers = await loadStickers()
        const matched = query ? substringMatch(stickers, query) : stickers
        const items = matched.slice(offset, offset + limit).map(s => ({ id: s.id, description: s.description || '', tags: s.tags || {} }))
        return { ok: true, data: { total: matched.length, items } }
      }
    }))

    // ═══════════════ 工具：update_sticker_tags ═══════════════
    ctx.tools.register(defineTool({
      name: 'update_sticker_tags',
      description: '修改表情包的描述或标签（管理用途）。用户要求改某张表情包的描述/标签，或你发现标签不准确时使用。只修改传入的字段。',
      parameters: {
        id: { type: 'string', required: true, description: '表情包ID，如 stk_001' },
        description: { type: 'string', description: '新的图片描述' },
        emotion: { type: 'array', items: { type: 'string' }, description: '情绪标签列表，如 [\'开心\', \'得意\']' },
        scene: { type: 'array', items: { type: 'string' }, description: '场景标签列表，如 [\'催回复\', \'调侃\']' },
        keywords: { type: 'array', items: { type: 'string' }, description: '关键词标签列表，如 [\'猫\', \'委屈\']' },
        semantic_description: { type: 'string', description: '语义描述：这张图在聊天中适合回复什么' }
      },
      output: {
        schema: { type: 'json' },
        render(_a, v) { return [{ type: 'text', text: v && v.ok ? '已更新表情包 ' + v.id + ' 的标签' : JSON.stringify(v) }] }
      },
      async execute(args) {
        const id = sanitizeTag(args && args.id, 40)
        if (!id) return { ok: false, error: '缺少表情包ID' }
        const stickers = await loadStickers()
        const sticker = stickers.find(s => s.id === id)
        if (!sticker) return { ok: false, error: '未找到表情包 ' + id }
        if (args.description !== undefined) sticker.description = sanitizeTag(args.description, 200)
        if (!sticker.tags) sticker.tags = { emotion: [], scene: [], keywords: [] }
        if (args.emotion !== undefined) sticker.tags.emotion = strArr(args.emotion)
        if (args.scene !== undefined) sticker.tags.scene = strArr(args.scene)
        if (args.keywords !== undefined) sticker.tags.keywords = strArr(args.keywords)
        if (args.semantic_description !== undefined) sticker.semantic_description = sanitizeTag(args.semantic_description, 500)
        sticker.updated_at = new Date().toISOString()
        await saveStickers(stickers)
        return { ok: true, id }
      }
    }))

    // ═══════════════ 工具：report_bad_match ═══════════════
    ctx.tools.register(defineTool({
      name: 'report_bad_match',
      description: '反馈某张表情包不贴合当前情绪（管理用途）。调用后，以后类似的情绪会少选这张图。',
      parameters: {
        sticker_id: { type: 'string', required: true, description: '表情包ID' },
        emotion: { type: 'string', description: '当时想表达的情绪，如「开心」' }
      },
      output: {
        schema: { type: 'json' },
        render(_a, v) { return [{ type: 'text', text: v && v.ok ? '已记录，以后类似情景会少配这张图' : JSON.stringify(v) }] }
      },
      async execute(args) {
        const id = sanitizeTag(args && args.sticker_id, 40)
        if (!id) return { ok: false, error: '缺少 sticker_id' }
        const emotion = sanitizeTag(args && args.emotion, 60)
        const dislikeCount = await applyFeedback(id, emotion, 'negative')
        return { ok: true, data: { dislike_count: dislikeCount } }
      }
    }))

    // ═══════════════ RPC：Client ↔ Host ═══════════════
    // 静态 bundle 模式：RPC 走 webServer HTTP 路由（POST /biaoqingbao/<method>）
    const rpcHandlers = new Map()
    function rpc(method, handler) {
      rpcHandlers.set(method, handler)
    }

    rpc('sticker-image', async (args) => {
      const id = args && args.id ? String(args.id) : ''
      if (!id) return { dataUri: null, error: '缺少 id' }
      const stickers = await loadStickers()
      const sticker = stickers.find(s => s.id === id)
      if (!sticker || !sticker.attachment || !sticker.attachment.attachmentId) return { dataUri: null, error: '未找到表情包' }
      try {
        const stored = await ctx.attachments.readImage(sticker.attachment)
        if (!stored || !stored.data) return { dataUri: null, error: '图片数据缺失' }
        const mediaType = stored.ref && stored.ref.mediaType ? stored.ref.mediaType : (sticker.attachment.mediaType || 'image/png')
        return { dataUri: 'data:' + mediaType + ';base64,' + bytesToBase64(stored.data), mediaType, bytes: stored.data.length }
      } catch (e) {
        return { dataUri: null, error: '读取图片失败: ' + e.message }
      }
    })

    rpc('list', async (args) => {
      const query = sanitizeTag(args && args.query, 60)
      const offset = Math.max(parseInt(args && args.offset, 10) || 0, 0)
      const limit = Math.min(Math.max(parseInt(args && args.limit, 10) || 40, 1), 100)
      const stickers = await loadStickers()
      const matched = query ? substringMatch(stickers, query) : stickers
      const items = matched.slice(offset, offset + limit).map(s => ({
        id: s.id, description: s.description || '', tags: s.tags || {}, added_at: s.added_at || null, tagged_at: s.tagged_at || null,
        attachment: s.attachment ? { mediaType: s.attachment.mediaType, bytes: s.attachment.bytes, width: s.attachment.width, height: s.attachment.height } : null
      }))
      return { ok: true, data: { total: matched.length, items } }
    })

    rpc('get', async (args) => {
      const id = args && args.id ? String(args.id) : ''
      if (!id) return { ok: false, error: '缺少 id' }
      const stickers = await loadStickers()
      const sticker = stickers.find(s => s.id === id)
      if (!sticker) return { ok: false, error: '未找到表情包' }
      const tags = sticker.tags || {}
      return {
        ok: true, data: {
          id: sticker.id, description: sticker.description || '',
          emotion: tags.emotion || [], scene: tags.scene || [], keywords: tags.keywords || [],
          semantic_description: sticker.semantic_description || '',
          added_at: sticker.added_at || null, tagged_at: sticker.tagged_at || null,
          attachment: sticker.attachment ? { mediaType: sticker.attachment.mediaType, bytes: sticker.attachment.bytes, width: sticker.attachment.width, height: sticker.attachment.height } : null
        }
      }
    })

    rpc('feedback', async (args) => {
      const id = args && args.sticker_id ? String(args.sticker_id) : ''
      if (!id) return { ok: false, error: '缺少 sticker_id' }
      const kind = args && args.kind === 'positive' ? 'positive' : 'negative'
      const emotion = sanitizeTag(args && args.emotion, 60)
      const stickers = await loadStickers()
      if (!stickers.some(s => s.id === id)) return { ok: false, error: '未找到表情包' }
      const dislikeCount = await applyFeedback(id, emotion, kind)
      return { ok: true, dislike_count: dislikeCount }
    })

    rpc('update-tags', async (args) => {
      const id = sanitizeTag(args && args.id, 40)
      if (!id) return { ok: false, error: '缺少 id' }
      const stickers = await loadStickers()
      const sticker = stickers.find(s => s.id === id)
      if (!sticker) return { ok: false, error: '未找到表情包' }
      if (args.description !== undefined) sticker.description = sanitizeTag(args.description, 200)
      if (!sticker.tags) sticker.tags = { emotion: [], scene: [], keywords: [] }
      if (args.emotion !== undefined) sticker.tags.emotion = strArr(args.emotion)
      if (args.scene !== undefined) sticker.tags.scene = strArr(args.scene)
      if (args.keywords !== undefined) sticker.tags.keywords = strArr(args.keywords)
      if (args.semantic_description !== undefined) sticker.semantic_description = sanitizeTag(args.semantic_description, 500)
      sticker.updated_at = new Date().toISOString()
      await saveStickers(stickers)
      return { ok: true }
    })

    rpc('upload', async (args) => {
      const files = Array.isArray(args && args.files) ? args.files : []
      if (!files.length) return { ok: false, error: '没有文件' }
      if (files.length > MAX_UPLOAD_COUNT) return { ok: false, error: '一次最多上传 ' + MAX_UPLOAD_COUNT + ' 张' }
      let maxBytes = 10 * 1024 * 1024
      try { maxBytes = ctx.attachments.imageLimits.maxImageBytes || maxBytes } catch (e) {}
      const stickers = await loadStickers()
      let added = 0
      const addedIds = []
      const errors = []
      for (const f of files) {
        try {
          const mediaType = f && f.mediaType ? String(f.mediaType) : ''
          if (!MIME_TO_EXT[mediaType]) { errors.push((f && f.name) + ': 不支持的格式'); continue }
          const bytes = base64ToBytes(f.data)
          if (!bytes.length) { errors.push((f && f.name) + ': 空文件'); continue }
          if (bytes.length > maxBytes) { errors.push((f && f.name) + ': 超过大小限制'); continue }
          const ref = await ctx.attachments.saveImage({ data: bytes, mediaType, name: (f && f.name) || undefined })
          const id = await genId(stickers)
          const base = String(f.name || id).replace(/\.[a-z0-9]+$/i, '')
          stickers.push({
            id,
            attachment: { attachmentId: ref.attachmentId, mediaType: ref.mediaType, bytes: ref.bytes, width: ref.width, height: ref.height, name: ref.name },
            description: sanitizeTag(base, 200),
            tags: { emotion: [], scene: [], keywords: [] },
            added_at: new Date().toISOString()
          })
          added += 1
          addedIds.push(id)
        } catch (e) {
          errors.push((f && f.name) + ': ' + e.message)
        }
      }
      if (added > 0) await saveStickers(stickers)
      return { ok: true, added, addedIds, errors }
    })

    rpc('import-zip', async (args) => {
      const zipBase64 = args && args.zipBase64 ? String(args.zipBase64) : ''
      const fileName = args && args.fileName ? String(args.fileName) : ''
      if (!zipBase64) return { ok: false, error: '缺少 ZIP 文件数据' }
      if (fileName && !fileName.toLowerCase().endsWith('.zip')) return { ok: false, error: '请选择 ZIP 文件' }
      let zipData = null
      try {
        const b64 = zipBase64.replace(/^data:[^;]+;base64,/, '')
        zipData = Buffer.from(b64, 'base64')
      } catch (e) {
        return { ok: false, error: 'ZIP 数据解析失败' }
      }
      if (!zipData || zipData.length === 0) return { ok: false, error: 'ZIP 文件为空' }
      if (zipData.length > 50 * 1024 * 1024) return { ok: false, error: 'ZIP 文件不能超过 50MB' }
      let images = []
      let skipped = []
      try {
        const result = await extractImagesFromZip(zipData)
        images = result.images
        skipped = result.skipped
      } catch (e) {
        return { ok: false, error: e.message || 'ZIP 解压失败' }
      }
      if (images.length === 0) return { ok: true, data: { imported: 0, skipped: skipped.length, skippedItems: skipped.slice(0, 30), importedIds: [] }, message: 'ZIP 里没有找到可导入的图片' }
      if (images.length > MAX_UPLOAD_COUNT) {
        skipped.push({ file: '…等 ' + (images.length - MAX_UPLOAD_COUNT) + ' 张', reason: '单次导入上限 ' + MAX_UPLOAD_COUNT + ' 张' })
        images = images.slice(0, MAX_UPLOAD_COUNT)
      }
      let maxBytes = 10 * 1024 * 1024
      try { maxBytes = ctx.attachments.imageLimits.maxImageBytes || maxBytes } catch (e) {}
      const stickers = await loadStickers()
      let imported = 0
      const importedIds = []
      const errors = []
      for (const image of images) {
        try {
          const mediaType = EXT_TO_MIME[image.ext]
          if (!mediaType) { skipped.push({ file: image.fileName, reason: '不支持的格式' }); continue }
          if (image.data.length > maxBytes) { skipped.push({ file: image.fileName, reason: '超过大小限制' }); continue }
          const ref = await ctx.attachments.saveImage({ data: image.data, mediaType, name: image.fileName })
          const id = await genId(stickers)
          stickers.push({
            id,
            attachment: { attachmentId: ref.attachmentId, mediaType: ref.mediaType, bytes: ref.bytes, width: ref.width, height: ref.height, name: ref.name },
            description: sanitizeTag(image.fileName.replace(/\.[a-z0-9]+$/i, ''), 200),
            tags: { emotion: [], scene: [], keywords: [] },
            added_at: new Date().toISOString()
          })
          imported += 1
          importedIds.push(id)
        } catch (e) {
          errors.push(image.fileName + ': ' + e.message)
        }
      }
      if (imported > 0) await saveStickers(stickers)
      const totalSkipped = skipped.length + errors.length
      return {
        ok: true,
        data: {
          imported,
          skipped: totalSkipped,
          skippedItems: [...skipped, ...errors.map(t => ({ file: t.split(':')[0], reason: t.split(':').slice(1).join(':') }))].slice(0, 30),
          importedIds
        },
        message: '成功导入 ' + imported + ' 张' + (totalSkipped > 0 ? '，跳过 ' + totalSkipped + ' 个文件' : '')
      }
    })

    rpc('delete', async (args) => {
      const id = args && args.id ? String(args.id) : ''
      if (!id) return { ok: false, error: '缺少 id' }
      const stickers = await loadStickers()
      const next = stickers.filter(s => s.id !== id)
      if (next.length === stickers.length) return { ok: false, error: '未找到表情包' }
      await saveStickers(next)
      return { ok: true }
    })

    rpc('stats', async () => {
      const stickers = await loadStickers()
      const prefs = await loadPrefs()
      const config = await loadConfig()
      let totalBytes = 0
      let untagged = 0
      for (const s of stickers) {
        totalBytes += (s.attachment && s.attachment.bytes) || 0
        if (!s.tagged_at) untagged += 1
      }
      return {
        ok: true, data: {
          count: stickers.length, totalBytes, untagged, enabled: config.enabled === true,
          mappings: (prefs.users.default.mappings || []).length
        }
      }
    })

    rpc('vision-tag', async (args) => {
      const id = args && args.id ? String(args.id) : ''
      if (!id) return { ok: false, error: '缺少 id' }
      const stickers = await loadStickers()
      const sticker = stickers.find(s => s.id === id)
      if (!sticker) return { ok: false, error: '未找到表情包' }
      const result = await visionTagOne(sticker)
      if (result.ok) {
        await saveStickers(stickers)
        await ensureVectorForSticker(sticker)
      }
      return { ok: result.ok, error: result.error, raw: result.raw, data: result.data }
    })

    rpc('vision-tag-all', async () => {
      const stickers = await loadStickers()
      const pending = stickers.filter(s => !s.tagged_at)
      if (!pending.length) return { ok: true, data: { total: 0, done: 0, failed: [] } }
      const failed = []
      let done = 0
      for (const sticker of pending) {
        const result = await visionTagOne(sticker)
        if (result.ok) {
          done += 1
          await ensureVectorForSticker(sticker)
        }
        else failed.push({ id: sticker.id, error: result.error || '失败', raw: result.raw })
      }
      await saveStickers(stickers)
      return { ok: true, data: { total: pending.length, done, failed } }
    })

    rpc('prefs-list', async () => {
      const prefs = await loadPrefs()
      const mappings = (prefs.users.default.mappings || []).map((m, index) => ({
        index,
        emotion: m.context ? m.context.emotion : '',
        keywords: (m.context && m.context.keywords) || [],
        weight: m.weight || 1,
        preferred: m.preferred_ids || [],
        vetoed: m.vetoed_ids || [],
        dislikes: Object.entries(m.dislike_counts || {}).filter(e => e[1] > 0),
        updated_at: m.updated_at || null
      }))
      return { ok: true, data: { mappings } }
    })

    rpc('prefs-remove', async (args) => {
      const prefs = await loadPrefs()
      const index = parseInt(args && args.index, 10)
      const mappings = prefs.users.default.mappings
      if (!Number.isInteger(index) || index < 0 || index >= mappings.length) return { ok: false, error: '映射不存在' }
      mappings.splice(index, 1)
      await savePrefs(prefs)
      return { ok: true }
    })

    rpc('prefs-remove-item', async (args) => {
      const prefs = await loadPrefs()
      const index = parseInt(args && args.index, 10)
      const mappings = prefs.users.default.mappings
      if (!Number.isInteger(index) || index < 0 || index >= mappings.length) return { ok: false, error: '映射不存在' }
      const mapping = mappings[index]
      const list = String(args && args.list || '')
      const stickerId = args && args.sticker_id ? String(args.sticker_id) : ''
      if (list === 'preferred') mapping.preferred_ids = (mapping.preferred_ids || []).filter(id => id !== stickerId)
      else if (list === 'vetoed') mapping.vetoed_ids = (mapping.vetoed_ids || []).filter(id => id !== stickerId)
      else if (list === 'dislikes') { if (mapping.dislike_counts) delete mapping.dislike_counts[stickerId] }
      else return { ok: false, error: 'list 必须是 preferred / vetoed / dislikes' }
      mapping.updated_at = new Date().toISOString()
      await savePrefs(prefs)
      return { ok: true }
    })

    rpc('config-get', async () => {
      const config = await loadConfig()
      const tpl = await loadStyleTemplate()
      const e = config.embedding || {}
      return {
        ok: true, data: {
          enabled: config.enabled === true,
          visionProvider: config.visionProvider || '',
          visionModel: config.visionModel || '',
          observer: { enabled: !!(config.observer && config.observer.enabled), frequency: (config.observer && config.observer.frequency) || 30 },
          dialect: { id: (config.dialect && config.dialect.id) || '', boost: !!(config.dialect && config.dialect.boost) },
          style: { current: tpl.current || '', draft: tpl.draft || '', previous: tpl.previous || '' },
          embedding: {
            customBaseUrl: e.customBaseUrl || '',
            customApiKey: e.customApiKey ? String(e.customApiKey).substring(0, 8) + '***' : '',
            customModel: e.customModel || '',
            customDimensions: e.customDimensions || 0,
            hasKey: !!(e.customApiKey)
          }
        }
      }
    })

    rpc('config-set', async (args) => {
      const config = await loadConfig()
      if (args && typeof args.enabled === 'boolean') config.enabled = args.enabled
      if (args && typeof args.visionProvider === 'string') config.visionProvider = sanitizeTag(args.visionProvider, 100)
      if (args && typeof args.visionModel === 'string') config.visionModel = sanitizeTag(args.visionModel, 100)
      if (args && args.observer && typeof args.observer === 'object') {
        if (typeof args.observer.enabled === 'boolean') config.observer.enabled = args.observer.enabled
        if (typeof args.observer.frequency === 'number') config.observer.frequency = Math.max(0, Math.min(100, args.observer.frequency))
      }
      if (args && args.dialect && typeof args.dialect === 'object') {
        if (typeof args.dialect.id === 'string') {
          config.dialect.id = args.dialect.id === '' ? '' : sanitizeTag(args.dialect.id, 30)
          if (config.dialect.id && !DIALECTS[config.dialect.id] && config.dialect.id !== 'userstyle') config.dialect.id = ''
        }
        if (typeof args.dialect.boost === 'boolean') config.dialect.boost = args.dialect.boost
      }
      await saveConfig(config)
      applyDialectState(config)
      if (config.dialect.id === 'userstyle') {
        const tpl = await loadStyleTemplate()
        dialectState.template = tpl.current || ''
      }
      return { ok: true }
    })

    // ═══════════════ RPC：模型列表（视觉模型下拉） ═══════════════
    rpc('list-models', async () => {
      const providers = []
      try {
        const list = ctx.llm && typeof ctx.llm.listProviders === 'function' ? ctx.llm.listProviders() : []
        for (const p of (Array.isArray(list) ? list : [])) {
          const pid = p && p.id ? String(p.id) : ''
          if (!pid) continue
          const entry = { providerId: pid, providerName: (p && p.name) || pid, models: [] }
          try {
            const models = await ctx.llm.listModels(pid)
            entry.models = (Array.isArray(models) ? models : []).map(m => {
              // inputModalities 缺失 = 未知（不排除支持图片），显式空数组 = 不支持
              let supportsImage = null
              if (Array.isArray(m && m.inputModalities)) supportsImage = m.inputModalities.includes('image')
              return { id: m && m.id ? String(m.id) : '', name: (m && m.name) || (m && m.id) || '', supportsImage }
            }).filter(m => m.id)
          } catch (e) { entry.models = [] }
          providers.push(entry)
        }
      } catch (e) {}
      return { ok: true, data: providers }
    })

    // ═══════════════ RPC：识图模型连通测试 ═══════════════
    rpc('vision-test', async (args) => {
      try {
        let provider = ''
        let model = ''
        if (args && typeof args.visionProvider === 'string' && String(args.visionProvider).trim() && typeof args.visionModel === 'string' && String(args.visionModel).trim()) {
          provider = String(args.visionProvider).trim().slice(0, 100)
          model = String(args.visionModel).trim().slice(0, 100)
        } else {
          const config = await loadConfig()
          provider = config.visionProvider || ''
          model = config.visionModel || ''
        }
        if (!provider || !model) {
          // 回退到会话默认模型
          let sel = null
          try { sel = ctx.agentDefaultModel.currentSelection() } catch (e) {}
          if (sel && sel.provider && sel.model) { provider = sel.provider; model = sel.model }
        }
        if (!provider || !model) return { ok: false, error: '未配置模型（请在 AI 识图模型区块选择或填写 Provider / 模型 ID）' }
        let text = ''
        let finish = null
        const stream = ctx.llm.stream({
          provider,
          model,
          messages: [{ role: 'user', content: [{ type: 'text', text: '连接测试，请只回复两个字：正常' }] }],
          maxTokens: 50,
          temperature: 0
        })
        for await (const chunk of stream) {
          if (chunk.type === 'text-delta') text += chunk.text
          else if (chunk.type === 'finish') finish = chunk.reason
        }
        if (finish && finish.kind === 'error' && finish.failure) return { ok: false, error: '模型调用失败：' + (finish.failure.message || '未知错误') }
        if (finish && finish.kind === 'aborted') return { ok: false, error: '模型调用被中断' }
        return { ok: true, data: { provider, model, reply: String(text || '').slice(0, 100) } }
      } catch (e) {
        return { ok: false, error: e && e.message ? e.message : String(e) }
      }
    })

    // ═══════════════ RPC：向量检索（embedding） ═══════════════
    rpc('embedding-config-get', async () => {
      const cfg = await loadConfig()
      const e = cfg.embedding || {}
      return {
        ok: true,
        data: {
          source: 'custom',
          customBaseUrl: e.customBaseUrl || '',
          customApiKey: e.customApiKey ? String(e.customApiKey).substring(0, 8) + '***' : '',
          customModel: e.customModel || '',
          customDimensions: e.customDimensions || 0,
          hasKey: !!(e.customApiKey)
        }
      }
    })

    rpc('embedding-config-set', async (args) => {
      const cfg = await loadConfig()
      if (!cfg.embedding || typeof cfg.embedding !== 'object') cfg.embedding = {}
      const e = cfg.embedding
      if (args && typeof args.customBaseUrl === 'string') e.customBaseUrl = String(args.customBaseUrl).trim().slice(0, 300)
      if (args && typeof args.customModel === 'string') e.customModel = String(args.customModel).trim().slice(0, 100)
      if (args && typeof args.customDimensions === 'number' && args.customDimensions > 0) e.customDimensions = Math.floor(args.customDimensions)
      if (args && typeof args.customApiKey === 'string' && args.customApiKey.trim()) {
        // 占位符不覆盖已存 key；留空保持原值
        if (args.customApiKey !== '********' && !String(args.customApiKey).includes('***')) {
          e.customApiKey = args.customApiKey.trim().slice(0, 300)
        }
      }
      await saveConfig(cfg)
      return { ok: true }
    })

    rpc('embedding-test', async (args) => {
      try {
        const cfg = await loadConfig()
        const disk = cfg.embedding || {}
        const e = { ...disk }
        if (args && typeof args.customBaseUrl === 'string') e.customBaseUrl = String(args.customBaseUrl).trim().slice(0, 300)
        if (args && typeof args.customModel === 'string') e.customModel = String(args.customModel).trim().slice(0, 100)
        if (args && typeof args.customApiKey === 'string' && args.customApiKey.trim() && args.customApiKey !== '********' && !String(args.customApiKey).includes('***')) {
          e.customApiKey = args.customApiKey.trim().slice(0, 300)
        }
        const baseUrl = e.customBaseUrl || ''
        const apiKey = e.customApiKey || ''
        const model = e.customModel || ''
        if (!baseUrl || !apiKey || !model) return { ok: false, error: '未配置 Embedding 模型（请检查 Base URL / Key / 模型名是否完整）' }
        const result = await generateEmbeddings({ baseUrl, apiKey, model }, ['连接测试'])
        if (!result.ok) return { ok: false, error: result.error }
        return { ok: true, data: { dimensions: result.data[0].length, model } }
      } catch (e) {
        return { ok: false, error: e && e.message ? e.message : String(e) }
      }
    })

    rpc('generate-embeddings', async (args) => {
      const cfg = await loadConfig()
      const { baseUrl, apiKey, model } = resolveEmbeddingApi(cfg)
      if (!baseUrl || !apiKey || !model) return { ok: false, error: '未配置 Embedding 模型' }
      const stickers = await loadStickers()
      const existing = await loadVectors()
      const existingVectors = existing.vectors || {}
      const withDesc = stickers.filter(s => s.semantic_description && String(s.semantic_description).trim())
      const hasVectors = Object.keys(existingVectors).length > 0
      // 模型变更时整体重算，避免新旧模型向量混库
      const modelChanged = Boolean(existing.model && existing.model !== model) || (hasVectors && !existing.model)
      const onlyMissing = !(args && args.onlyMissing === false)
      const targets = withDesc.filter(s => {
        if (modelChanged) return true
        if (onlyMissing) return !existingVectors[s.id]
        return true
      })
      if (!targets.length) {
        return { ok: true, data: { total: 0, processed: 0, failed: 0, skipped: withDesc.length } }
      }
      const BATCH_SIZE = 20
      const vectors = modelChanged ? {} : { ...existingVectors }
      let processed = 0
      let failed = 0
      const errors = []
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE)
        const result = await generateEmbeddings({ baseUrl, apiKey, model }, batch.map(s => s.semantic_description))
        if (!result.ok) {
          failed += batch.length
          errors.push('批次 ' + (i / BATCH_SIZE + 1) + ': ' + result.error)
          continue
        }
        for (let j = 0; j < batch.length; j++) {
          if (result.data[j]) { vectors[batch[j].id] = result.data[j]; processed++ } else failed++
        }
      }
      if (modelChanged && processed === 0 && Object.keys(vectors).length === 0) {
        return { ok: true, data: { total: targets.length, processed: 0, failed: targets.length, errors, note: '模型已更换且本次生成全部失败，未写入任何新向量（旧库保持不变），请检查模型配置后重试' } }
      }
      let dimensions = existing.dimensions || 0
      for (const key of Object.keys(vectors)) {
        if (Array.isArray(vectors[key]) && vectors[key].length) { dimensions = vectors[key].length; break }
      }
      await saveVectors({ version: 1, model, dimensions, generated_at: new Date().toISOString(), vectors })
      return { ok: true, data: { total: targets.length, processed, failed, errors: errors.length ? errors : undefined } }
    })

    rpc('vector-status', async () => {
      const stickers = await loadStickers()
      const withDesc = stickers.filter(s => s.semantic_description && String(s.semantic_description).trim())
      const v = await loadVectors()
      const vectorMap = v.vectors || {}
      const cfg = await loadConfig()
      const { baseUrl, apiKey, model } = resolveEmbeddingApi(cfg)
      const configured = Boolean(baseUrl && apiKey && model)
      const modelChanged = Boolean(v.model && model && v.model !== model)
      const pending = withDesc.filter(s => modelChanged || !vectorMap[s.id]).length
      return {
        ok: true,
        data: {
          totalStickers: stickers.length,
          withSemanticDesc: withDesc.length,
          vectorCount: Object.keys(vectorMap).length,
          pending,
          configured,
          model: v.model || '',
          generated_at: v.generated_at || '',
          dimensions: v.dimensions || 0,
        }
      }
    })

    rpc('style-analyze', async (args) => {
      const level = args && args.level === 'deep' ? 'deep' : 'light'
      return runStyleAnalysis(level)
    })

    rpc('style-confirm', async (args) => {
      const tpl = await loadStyleTemplate()
      const draft = args && typeof args.draft === 'string' && args.draft.trim() ? String(args.draft).trim() : tpl.draft
      if (!draft) return { ok: false, error: '没有可确认的风格模板' }
      const problems = checkStyleDraft(draft)
      if (problems.length) return { ok: false, error: '模板未通过检查：' + problems.join('；') }
      tpl.previous = tpl.current || ''
      tpl.current = draft
      tpl.draft = ''
      tpl.updated_at = new Date().toISOString()
      await saveStyleTemplate(tpl)
      const config = await loadConfig()
      config.dialect = config.dialect || {}
      config.dialect.id = 'userstyle'
      await saveConfig(config)
      applyDialectState(config)
      dialectState.template = tpl.current
      return { ok: true }
    })

    rpc('style-revert', async () => {
      const tpl = await loadStyleTemplate()
      if (!tpl.current && !tpl.previous) return { ok: false, error: '没有可回退的版本' }
      if (tpl.previous) {
        const tmp = tpl.current
        tpl.current = tpl.previous
        tpl.previous = tmp
      } else {
        tpl.current = ''
      }
      tpl.updated_at = new Date().toISOString()
      await saveStyleTemplate(tpl)
      const config = await loadConfig()
      config.dialect = config.dialect || {}
      config.dialect.id = tpl.current ? 'userstyle' : ''
      await saveConfig(config)
      applyDialectState(config)
      dialectState.template = tpl.current || ''
      return { ok: true }
    })

    // ═══════════════ HTTP 路由：Client RPC 分发（静态模式） ═══════════════
    ctx.inject(['webServer'], (hostCtx) => {
      hostCtx.effect(() => hostCtx.webServer.register({
        kind: 'prefix',
        path: '/biaoqingbao',
        handler: async (req, res) => {
          try {
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
              return
            }
            const url = String(req.url || '')
            const q = url.indexOf('?')
            const path = q === -1 ? url : url.slice(0, q)
            const method = decodeURIComponent(path.slice('/biaoqingbao/'.length))
            const handler = rpcHandlers.get(method)
            if (!handler) {
              res.writeHead(404, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: false, error: 'no such rpc: ' + method }))
              return
            }
            let raw = ''
            for await (const chunk of req) raw += chunk
            let args = null
            if (raw) {
              try { args = JSON.parse(raw) } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ ok: false, error: 'bad json body' }))
                return
              }
            }
            const result = await handler(args)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(result))
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: e.message || String(e) }))
          }
        }
      }), 'biaoqingbao: rpc routes')
      console.log('[biaoqingbao] http routes mounted at /biaoqingbao/')
    })

    // 启动：刷新方言状态 + 日志
    refreshDialectState().then(() => {
      console.log('[biaoqingbao] apply OK dialect=' + (dialectState.id || 'none'))
    }).catch(() => {})
    dataDir().then(dir => {
      console.log('[biaoqingbao] dataDir=' + dir + (boot.bootError ? ' bootError=' + boot.bootError : ''))
    }).catch(e => {
      console.error('[biaoqingbao] apply error: ' + e.message)
    })
}
