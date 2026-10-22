import { useMemo, useState, type ReactNode } from "react";

type Screen =
  | "feed"
  | "mapa"
  | "salvos"
  | "notificacoes"
  | "transparencia"
  | "perfil"
  | "seguranca"
  | "configuracoes";

type IconName =
  | "home"
  | "map"
  | "bookmark"
  | "bell"
  | "chart"
  | "user"
  | "shield"
  | "settings"
  | "search"
  | "pin"
  | "chevron"
  | "plus"
  | "idea"
  | "alert"
  | "support"
  | "oppose"
  | "comment"
  | "share"
  | "more"
  | "image"
  | "close"
  | "check"
  | "lock"
  | "users"
  | "filter"
  | "arrow";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4Z"/>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  idea: <><path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/></>,
  alert: <><path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/></>,
  support: <path d="m7 11 3 3 7-7"/>,
  oppose: <path d="m7 7 10 10M17 7 7 17"/>,
  comment: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
  share: <><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5"/>,
};

function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Button({ children, className = "", onClick, title, type = "button" }: { children: ReactNode; className?: string; onClick?: () => void; title?: string; type?: "button" | "submit" }) {
  return <button type={type} className={className} onClick={onClick} title={title}>{children}</button>;
}

const navItems: { id: Screen; label: string; icon: IconName }[] = [
  { id: "feed", label: "Início", icon: "home" },
  { id: "mapa", label: "Mapa da cidade", icon: "map" },
  { id: "salvos", label: "Salvos", icon: "bookmark" },
  { id: "notificacoes", label: "Notificações", icon: "bell" },
  { id: "transparencia", label: "Transparência", icon: "chart" },
];

const photos = {
  city: "https://images.unsplash.com/photo-1572894234976-d961418c709d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  street: "https://images.unsplash.com/photo-1712007449695-e20435550a2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  road: "https://images.unsplash.com/photo-1784548789954-655c9a9e1a64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

const posts = [
  {
    id: 1,
    type: "Problema",
    author: "Marina Souza",
    handle: "@marinasouza",
    time: "há 32 min",
    neighborhood: "Campo Grande",
    title: "Faixa de pedestres apagada perto da escola",
    body: "Na Av. Expedito Garcia, em frente à escola, a faixa está quase invisível. Nos horários de entrada e saída fica perigoso para as crianças.",
    image: photos.street,
    support: 84,
    oppose: 3,
    comments: 12,
    avatar: "MS",
  },
  {
    id: 2,
    type: "Ideia",
    author: "Morador anônimo",
    handle: "Autor oculto",
    time: "há 1 h",
    neighborhood: "Itacibá",
    title: "Horta comunitária no terreno ao lado da praça",
    body: "O espaço está sem uso há anos. Poderíamos reunir moradores, escolas e comerciantes para criar uma horta e oficinas aos sábados.",
    support: 126,
    oppose: 8,
    comments: 27,
    avatar: "MA",
  },
  {
    id: 3,
    type: "Problema",
    author: "João Ribeiro",
    handle: "@joaoribeiro",
    time: "há 3 h",
    neighborhood: "Alto Lage",
    title: "Buraco aumentando depois das últimas chuvas",
    body: "Já ocupa boa parte da rua e os carros precisam desviar pela contramão. Fica próximo ao ponto de ônibus.",
    image: photos.road,
    support: 57,
    oppose: 2,
    comments: 9,
    avatar: "JR",
  },
];

function AppLogo() {
  return (
    <div className="logo">
      <div className="logo-mark"><span></span><span></span><span></span></div>
      <div><strong>minha</strong><b>cidade</b></div>
    </div>
  );
}

function Sidebar({ screen, go, openComposer }: { screen: Screen; go: (s: Screen) => void; openComposer: () => void }) {
  return (
    <aside className="sidebar">
      <AppLogo />
      <Button className="create-button" onClick={openComposer}><Icon name="plus" size={19} /> Nova publicação</Button>
      <nav className="side-nav">
        {navItems.map((item) => (
          <Button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => go(item.id)}>
            <Icon name={item.icon} /><span>{item.label}</span>
            {item.id === "notificacoes" && <small>4</small>}
          </Button>
        ))}
      </nav>
      <div className="side-divider" />
      <Button className={`nav-item ${screen === "seguranca" ? "active" : ""}`} onClick={() => go("seguranca")}><Icon name="shield" /><span>Segurança e regras</span></Button>
      <Button className={`nav-item ${screen === "configuracoes" ? "active" : ""}`} onClick={() => go("configuracoes")}><Icon name="settings" /><span>Configurações</span></Button>
      <div className="user-card">
        <div className="avatar avatar-photo">AS</div>
        <div><b>Ana Santos</b><span>@anasan</span></div>
        <Icon name="more" />
      </div>
    </aside>
  );
}

function Header({ title, screen, go }: { title: string; screen: Screen; go: (s: Screen) => void }) {
  return (
    <header className="topbar">
      <div className="mobile-logo"><AppLogo /></div>
      <div className="page-title">{title}</div>
      <div className="top-actions">
        <Button className="location"><Icon name="pin" size={17} /> Cariacica, ES <Icon name="chevron" size={14} /></Button>
        <Button className={`icon-button ${screen === "notificacoes" ? "selected" : ""}`} onClick={() => go("notificacoes")} title="Notificações"><Icon name="bell" /><i>4</i></Button>
        <Button className="avatar avatar-photo" onClick={() => go("perfil")}>AS</Button>
      </div>
    </header>
  );
}

function FilterChip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <Button className={`chip ${active ? "active" : ""}`}>{children}</Button>;
}

function ReactionButton({ icon, children, active, onClick }: { icon: IconName; children: ReactNode; active?: boolean; onClick?: () => void }) {
  return <Button className={`reaction ${active ? "reacted" : ""}`} onClick={onClick}><Icon name={icon} size={18} />{children}</Button>;
}

function PostCard({ post }: { post: (typeof posts)[number] }) {
  const [reaction, setReaction] = useState<"support" | "oppose" | null>(null);
  const [saved, setSaved] = useState(false);
  const react = (value: "support" | "oppose") => setReaction(reaction === value ? null : value);
  return (
    <article className="post-card">
      <div className="post-head">
        <div className={`avatar ${post.author === "Morador anônimo" ? "anonymous" : ""}`}>{post.avatar}</div>
        <div className="post-author"><div><b>{post.author}</b>{post.id === 1 && <span className="verified"><Icon name="check" size={10} /></span>}</div><span>{post.handle} · {post.time}</span></div>
        <Button className="more-button"><Icon name="more" /></Button>
      </div>
      <div className="post-meta">
        <span className={`type ${post.type === "Ideia" ? "idea" : ""}`}><Icon name={post.type === "Ideia" ? "idea" : "alert"} size={13} />{post.type}</span>
        <span><Icon name="pin" size={13} />{post.neighborhood}</span>
      </div>
      <div className="post-title">{post.title}</div>
      <p className="post-body">{post.body}</p>
      {post.image && <img className="post-image" src={post.image} alt={post.title} />}
      <div className="post-stats"><span><b>{post.support + (reaction === "support" ? 1 : 0)}</b> apoios</span><span>{post.comments} comentários</span></div>
      <div className="post-actions">
        <ReactionButton icon="support" active={reaction === "support"} onClick={() => react("support")}>Apoiar</ReactionButton>
        <ReactionButton icon="oppose" active={reaction === "oppose"} onClick={() => react("oppose")}>Opor-se</ReactionButton>
        <ReactionButton icon="comment">{post.comments}</ReactionButton>
        <Button className={`save-button ${saved ? "saved" : ""}`} onClick={() => setSaved(!saved)} title="Salvar para depois"><Icon name="bookmark" size={19} filled={saved} /></Button>
      </div>
    </article>
  );
}

function Feed({ openComposer }: { openComposer: () => void }) {
  const [tab, setTab] = useState("Para você");
  return (
    <>
      <section className="feed-intro">
        <div><span className="eyebrow">Bom dia, Ana</span><div className="hero-title">O que está acontecendo perto de você?</div></div>
        <Button className="search-box"><Icon name="search" size={18} /><span>Buscar no seu bairro</span><kbd>⌘ K</kbd></Button>
      </section>
      <div className="quick-compose">
        <div className="avatar avatar-photo">AS</div>
        <Button className="compose-prompt" onClick={openComposer}>Compartilhe um problema ou uma ideia...</Button>
        <Button className="quick-type problem" onClick={openComposer}><Icon name="alert" size={17} />Problema</Button>
        <Button className="quick-type idea" onClick={openComposer}><Icon name="idea" size={17} />Ideia</Button>
      </div>
      <div className="feed-controls">
        <div className="tabs">{["Para você", "Recentes", "Mais apoiados"].map((item) => <Button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}>{item}</Button>)}</div>
        <div className="chips"><FilterChip active>Todo Cariacica</FilterChip><FilterChip>Meu bairro</FilterChip><FilterChip><Icon name="filter" size={15} /> Filtros</FilterChip></div>
      </div>
      <div className="feed-list">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
    </>
  );
}

function RightRail({ go }: { go: (s: Screen) => void }) {
  return (
    <aside className="right-rail">
      <div className="city-card">
        <img src={photos.city} alt="Vista urbana de Cariacica" />
        <div className="city-overlay"><span>Sua cidade hoje</span><b>Cariacica</b><small>Espírito Santo</small></div>
        <div className="city-stats"><div><b>248</b><span>publicações</span></div><div><b>1.8 mil</b><span>participações</span></div></div>
      </div>
      <div className="rail-card">
        <div className="rail-title"><span>Em alta no bairro</span><Button>Ver tudo</Button></div>
        <div className="trend"><b>01</b><div><span>Iluminação pública</span><small>32 publicações esta semana</small></div></div>
        <div className="trend"><b>02</b><div><span>Segurança no trânsito</span><small>24 publicações esta semana</small></div></div>
        <div className="trend"><b>03</b><div><span>Praças e lazer</span><small>19 publicações esta semana</small></div></div>
      </div>
      <div className="rail-card impact">
        <div className="impact-icon"><Icon name="chart" /></div>
        <div><b>Veja o impacto da comunidade</b><p>Acompanhe temas e ações de cada bairro.</p><Button onClick={() => go("transparencia")}>Abrir transparência <Icon name="arrow" size={15} /></Button></div>
      </div>
      <footer>Privacidade · Regras · Ajuda<br />© 2025 Minha Cidade</footer>
    </aside>
  );
}

function Notifications() {
  const [read, setRead] = useState<number[]>([]);
  const items = [
    { icon: "comment" as IconName, title: "Lucas comentou na sua publicação", text: "“Também notei isso ontem. Precisamos sinalizar...”", time: "há 8 min" },
    { icon: "support" as IconName, title: "12 pessoas apoiaram sua ideia", text: "Horta comunitária no terreno ao lado da praça", time: "há 41 min" },
    { icon: "users" as IconName, title: "Beatriz aceitou seu pedido de amizade", text: "Agora vocês fazem parte da rede um do outro.", time: "há 2 h" },
    { icon: "bell" as IconName, title: "Prefeitura de Cariacica respondeu", text: "A solicitação foi encaminhada à equipe responsável.", time: "ontem" },
  ];
  return (
    <section className="section-card">
      <div className="section-heading"><div><span className="eyebrow">Sua comunidade</span><div className="screen-title">Notificações</div></div><Button onClick={() => setRead([0,1,2,3])}>Marcar todas como lidas</Button></div>
      <div className="notification-tabs"><FilterChip active>Todas</FilterChip><FilterChip>Interações</FilterChip><FilterChip>Amizades</FilterChip></div>
      <div className="notification-list">{items.map((item, index) => (
        <Button key={item.title} className={`notification ${read.includes(index) ? "read" : ""}`} onClick={() => setRead([...read, index])}>
          <div className="notification-icon"><Icon name={item.icon} /></div><div><b>{item.title}</b><p>{item.text}</p><span>{item.time}</span></div>{!read.includes(index) && <i />}
        </Button>
      ))}</div>
    </section>
  );
}

function MapScreen() {
  const [selected, setSelected] = useState(1);
  const markers = [
    { id: 1, left: "39%", top: "37%", type: "problem", label: "Faixa apagada", place: "Campo Grande", icon: "alert" as IconName },
    { id: 2, left: "63%", top: "28%", type: "idea", label: "Nova área de lazer", place: "Itacibá", icon: "idea" as IconName },
    { id: 3, left: "71%", top: "61%", type: "problem", label: "Iluminação", place: "Alto Lage", icon: "alert" as IconName },
    { id: 4, left: "50%", top: "73%", type: "idea", label: "Horta comunitária", place: "Vila Capixaba", icon: "idea" as IconName },
  ];
  return (
    <section className="map-screen">
      <div className="map-toolbar">
        <div><span className="eyebrow">Explore Cariacica</span><div className="screen-title">Mapa da cidade</div><p>Descubra problemas e ideias perto de você.</p></div>
        <div className="chips"><FilterChip active>Todos <b>248</b></FilterChip><FilterChip>Problemas</FilterChip><FilterChip>Ideias</FilterChip></div>
      </div>
      <div className="map-canvas">
        <svg className="city-map-art" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-label="Mapa ilustrado de Cariacica">
          <rect width="1000" height="650" fill="#e9eee7" />
          <path className="map-water" d="M845-30c-62 92-15 160-75 232-41 49-29 118 26 155 63 42 27 118-8 165-31 42-29 91-2 151h250V-30Z" />
          <path className="map-park" d="M70 65c55-43 145-31 170 19 23 47-20 112-92 113-69 2-119-19-127-65-5-28 14-50 49-67Z" />
          <path className="map-park" d="M605 440c43-36 121-27 143 17 20 41-18 95-81 96-60 1-104-18-110-58-4-23 13-42 48-55Z" />
          <g className="minor-roads">
            <path d="M-40 117 285 290 520 262 858 445" /><path d="M-15 505 184 376 430 410 638 248 886 142" />
            <path d="M128-25 312 154 295 348 482 570" /><path d="M397-20 439 190 650 319 762 681" />
            <path d="M-18 260 167 250 343 64 674 84 858 210" /><path d="M50 643 222 474 431 493 638 616" />
            <path d="M72 20 63 368 228 617" /><path d="M580-15 565 181 750 368 900 397" />
            <path d="M254 0 208 204 395 341 368 650" /><path d="M0 432 273 445 528 351 820 598" />
          </g>
          <g className="block-roads">
            <path d="M0 185C198 203 316 247 452 351s257 104 399 94" />
            <path d="M105 650c53-180 167-261 296-333S632 154 780-10" />
            <path d="M-20 546c195-56 338-58 494-20s255 49 368 20" />
          </g>
          <g className="main-roads">
            <path d="M-30 322c173-48 307-13 430-64S646 112 841 97" />
            <path d="M215-30c58 121 103 220 206 310s196 167 231 400" />
          </g>
          <g className="road-center">
            <path d="M-30 322c173-48 307-13 430-64S646 112 841 97" />
            <path d="M215-30c58 121 103 220 206 310s196 167 231 400" />
          </g>
          <text x="210" y="245">CAMPO GRANDE</text><text x="585" y="192">ITACIBÁ</text><text x="680" y="520">ALTO LAGE</text><text x="300" y="535">VILA CAPIXABA</text>
          <text className="road-name" x="435" y="214" transform="rotate(-22 435 214)">Av. Expedito Garcia</text>
          <text className="road-name" x="495" y="405" transform="rotate(45 495 405)">BR–262</text>
          <text className="water-name" x="905" y="330" transform="rotate(90 905 330)">BAÍA DE VITÓRIA</text>
        </svg>
        <div className="map-floating-top">
          <Button className="map-search"><Icon name="search" size={18} /><span>Buscar rua ou bairro</span></Button>
          <Button className="map-filter"><Icon name="filter" size={17} /> Filtros <i>2</i></Button>
        </div>
        <div className="map-summary">
          <span>Nesta área</span>
          <b>43 publicações</b>
          <small>12 nas últimas 24 horas</small>
          <div><i className="problem-dot" /> 31 problemas <i className="idea-dot" /> 12 ideias</div>
        </div>
        <Button className="map-cluster c1">18</Button>
        <Button className="map-cluster c2">7</Button>
        {markers.map((marker) => (
          <Button
            key={marker.id}
            className={`map-marker ${marker.type} ${selected === marker.id ? "selected" : ""}`}
            style={{ left: marker.left, top: marker.top }}
            onClick={() => setSelected(marker.id)}
            title={`${marker.label}, ${marker.place}`}
          >
            <Icon name={marker.icon} size={17} />
          </Button>
        ))}
        <div className="map-detail-card">
          <div className="map-detail-head">
            <span className="type"><Icon name={selected === 2 || selected === 4 ? "idea" : "alert"} size={12} />{selected === 2 || selected === 4 ? "Ideia" : "Problema"}</span>
            <small>há 32 min</small>
            <Button><Icon name="close" size={16} /></Button>
          </div>
          <b>{markers.find((marker) => marker.id === selected)?.label}</b>
          <p>{selected === 1 ? "Faixa de pedestres apagada perto da escola" : selected === 2 ? "Uma nova área de lazer para o bairro" : selected === 3 ? "Postes sem iluminação na rua principal" : "Horta comunitária no terreno vazio"}</p>
          <div className="map-detail-place"><Icon name="pin" size={13} /> {markers.find((marker) => marker.id === selected)?.place}</div>
          <div className="map-detail-actions"><span><Icon name="support" size={15} /> 84 apoios</span><Button>Ver publicação <Icon name="arrow" size={14} /></Button></div>
        </div>
        <div className="map-controls"><Button title="Aproximar">+</Button><Button title="Afastar">−</Button><Button title="Minha localização"><Icon name="pin" size={17} /></Button></div>
        <div className="map-legend"><span><i className="problem-dot" /> Problemas</span><span><i className="idea-dot" /> Ideias</span></div>
      </div>
    </section>
  );
}

function Transparency() {
  return (
    <section>
      <div className="transparency-hero"><div><span className="eyebrow light">Dados abertos à comunidade</span><div className="screen-title light">Transparência em Cariacica</div><p>Um retrato agregado da participação cívica, sem expor dados pessoais.</p></div><Button>Baixar relatório <Icon name="arrow" size={16} /></Button></div>
      <div className="metric-grid">{[["1.248","publicações","↑ 12% no mês"],["8.614","participações","↑ 18% no mês"],["186","temas resolvidos","↑ 24 no mês"],["42","ações moderadas","3,4% do total"]].map((m) => <div className="metric" key={m[1]}><span>{m[1]}</span><b>{m[0]}</b><small>{m[2]}</small></div>)}</div>
      <div className="data-grid">
        <div className="section-card chart-card"><div className="rail-title"><span>Participação por semana</span><Button>Últimos 3 meses⌄</Button></div><div className="bars">{[38,55,46,72,61,84,68,92,78,98,86,112].map((v,i) => <div key={i}><i style={{height:`${v}px`}}/><span>{i % 3 === 0 ? `S${i+1}` : ""}</span></div>)}</div></div>
        <div className="section-card"><div className="rail-title"><span>Bairros mais ativos</span><Button>Ver todos</Button></div>{[["Campo Grande","248"],["Itacibá","196"],["Alto Lage","164"],["Jardim América","141"],["Porto de Santana","98"]].map((r,i) => <div className="ranking" key={r[0]}><b>{i+1}</b><span>{r[0]}</span><small>{r[1]} publicações</small></div>)}</div>
      </div>
      <div className="privacy-note"><Icon name="lock" /><div><b>Privacidade por design</b><p>Os dados desta página são agregados. Identidades, salvamentos e informações privadas nunca aparecem aqui.</p></div></div>
    </section>
  );
}

function Profile() {
  return (
    <section className="profile-page">
      <div className="cover"><img src={photos.city} alt="Capa do perfil" /></div>
      <div className="profile-main"><div className="profile-avatar">AS</div><Button className="outline-button">Editar perfil</Button><div className="screen-title">Ana Santos</div><span className="handle">@anasan</span><p>Moradora de Cariacica, mãe, arquiteta e apaixonada por cidades feitas para pessoas.</p><div className="profile-meta"><span><Icon name="pin" size={16}/> Campo Grande, Cariacica</span><span><Icon name="users" size={16}/> <b>128</b> amigos</span></div></div>
      <div className="profile-tabs"><Button className="active">Publicações <span>12</span></Button><Button>Ideias apoiadas</Button><Button>Amigos <span>128</span></Button></div>
      <div className="feed-list narrow">{posts.slice(0,2).map(post => <PostCard key={post.id} post={post} />)}</div>
    </section>
  );
}

function Saved() {
  return <section><div className="standard-head"><span className="eyebrow"><Icon name="lock" size={13}/> Só você vê</span><div className="screen-title">Salvos para depois</div><p>Publicações guardadas para ler com calma.</p></div><div className="feed-list narrow">{posts.slice(1).map(post => <PostCard key={post.id} post={post}/>)}</div></section>;
}

function Safety() {
  const additions = [
    ["Busca e mapa territorial","Inspirado em Colab e Citizen: encontrar temas por proximidade."],
    ["Central de segurança","Inspirado em Nextdoor: regras, denúncias e bloqueios em um só lugar."],
    ["Onboarding de território","Cidade e bairro definidos antes do feed para relevância desde o início."],
    ["Preferências de privacidade","Controle claro sobre bairro público, notificações e conta."],
  ];
  return (
    <section>
      <div className="standard-head"><span className="eyebrow">Confiança comunitária</span><div className="screen-title">Segurança e regras</div><p>Entenda como mantemos conversas locais úteis, respeitosas e privadas.</p></div>
      <div className="safety-grid"><div className="safety-card"><Icon name="shield"/><b>Denúncias não derrubam conteúdo automaticamente</b><p>Com 3 denúncias, o conteúdo entra na fila. Moderadores podem ocultar de forma reversível; só administradores removem definitivamente.</p></div><div className="safety-card"><Icon name="lock"/><b>Seu anonimato é protegido</b><p>Quando você publica anonimamente, sua identidade nunca aparece na leitura pública. Salvamentos também são sempre privados.</p></div><div className="safety-card"><Icon name="users"/><b>Moderação com responsabilidade</b><p>Ações são registradas, reversíveis e acompanhadas por métricas agregadas na página de transparência.</p></div></div>
      <div className="comparison">
        <div className="section-heading"><div><span className="eyebrow">Comparativo de mercado</span><div className="screen-title small">Telas adicionais identificadas</div></div><span className="included-badge">INCLUÍDAS</span></div>
        {additions.map((a,i) => <div className="addition" key={a[0]}><span>0{i+1}</span><div><b>{a[0]}</b><p>{a[1]}</p></div><Icon name="check"/></div>)}
      </div>
    </section>
  );
}

function Settings() {
  const [publicNeighborhood, setPublicNeighborhood] = useState(true);
  const [push, setPush] = useState(true);
  return (
    <section className="settings-page"><div className="standard-head"><span className="eyebrow">INCLUÍDO · privacidade visível</span><div className="screen-title">Configurações</div><p>Gerencie sua experiência e seus dados.</p></div>
      <div className="settings-card"><div className="settings-title">Privacidade do perfil</div><SettingRow icon="pin" title="Mostrar meu bairro no perfil" text="Sua cidade continuará pública." value={publicNeighborhood} change={() => setPublicNeighborhood(!publicNeighborhood)}/><SettingRow icon="bell" title="Notificações em tempo real" text="Comentários, reações e amizades." value={push} change={() => setPush(!push)}/><SettingRow icon="users" title="Lista pública de amigos" text="Outras pessoas podem ver suas conexões." value={true} change={() => {}}/></div>
      <div className="settings-card"><div className="settings-title">Conta e segurança</div>{[["user","Dados pessoais"],["shield","Pessoas bloqueadas"],["lock","Senha e acesso"]].map(r => <Button className="settings-link" key={r[1]}><Icon name={r[0] as IconName}/><span>{r[1]}</span><Icon name="chevron"/></Button>)}</div>
      <div className="settings-card danger-zone"><div><b>Encerrar minha conta</b><p>Seus dados pessoais serão apagados e suas publicações serão anonimizadas.</p></div><Button>Encerrar conta</Button></div>
    </section>
  );
}

function SettingRow({ icon, title, text, value, change }: { icon: IconName; title: string; text: string; value: boolean; change: () => void }) {
  return <div className="setting-row"><div className="setting-icon"><Icon name={icon}/></div><div><b>{title}</b><span>{text}</span></div><Button className={`toggle ${value ? "on" : ""}`} onClick={change}><i /></Button></div>;
}

function Composer({ close }: { close: () => void }) {
  const [type, setType] = useState<"Problema" | "Ideia">("Problema");
  const [anonymous, setAnonymous] = useState(false);
  const [published, setPublished] = useState(false);
  if (published) return <div className="modal-backdrop"><div className="success-modal"><div className="success-icon"><Icon name="check" size={28}/></div><div className="screen-title small">Publicado na sua cidade</div><p>Sua publicação já está visível para moradores de Cariacica.</p><Button className="primary-button" onClick={close}>Ver no feed</Button></div></div>;
  return (
    <div className="modal-backdrop">
      <div className="composer-modal">
        <div className="composer-head"><div><span className="eyebrow">Nova publicação</span><div className="screen-title small">O que você quer compartilhar?</div></div><Button className="icon-button" onClick={close}><Icon name="close"/></Button></div>
        <div className="type-picker"><Button className={type === "Problema" ? "selected problem" : ""} onClick={() => setType("Problema")}><Icon name="alert"/><div><b>Problema</b><span>Algo que precisa ser resolvido</span></div><i><Icon name="check" size={14}/></i></Button><Button className={type === "Ideia" ? "selected idea" : ""} onClick={() => setType("Ideia")}><Icon name="idea"/><div><b>Ideia</b><span>Uma proposta para melhorar a cidade</span></div><i><Icon name="check" size={14}/></i></Button></div>
        <label className="field"><span>Título</span><input placeholder={type === "Problema" ? "Ex: Poste apagado na Rua das Flores" : "Ex: Uma nova horta comunitária"} maxLength={100}/><small>0/100</small></label>
        <label className="field"><span>Conte mais detalhes</span><textarea placeholder="Ajude seus vizinhos a entender o contexto..." rows={5}/></label>
        <div className="composer-row"><label className="field compact"><span>Localização</span><Button className="fake-input"><Icon name="pin" size={17}/> Campo Grande, Cariacica <Icon name="chevron" size={15}/></Button></label><div className="photo-upload"><Icon name="image"/><span>Adicionar fotos</span><small>até 3</small></div></div>
        <Button className={`anonymous-choice ${anonymous ? "active" : ""}`} onClick={() => setAnonymous(!anonymous)}><div className="anonymous-icon"><Icon name={anonymous ? "lock" : "user"}/></div><div><b>Publicar anonimamente</b><span>Seu nome não aparecerá publicamente. Só você reconhecerá a publicação.</span></div><div className={`toggle ${anonymous ? "on" : ""}`}><i/></div></Button>
        <div className="composer-footer"><span><Icon name="shield" size={16}/> Sua publicação segue as regras da comunidade</span><Button className="primary-button" onClick={() => setPublished(true)}>Publicar {type.toLowerCase()} <Icon name="arrow" size={16}/></Button></div>
      </div>
    </div>
  );
}

function BottomNav({ screen, go, openComposer }: { screen: Screen; go: (s: Screen) => void; openComposer: () => void }) {
  return <div className="bottom-nav"><Button className={screen === "feed" ? "active" : ""} onClick={() => go("feed")}><Icon name="home"/><span>Início</span></Button><Button className={screen === "mapa" ? "active" : ""} onClick={() => go("mapa")}><Icon name="map"/><span>Mapa</span></Button><Button className="mobile-create" onClick={openComposer}><Icon name="plus" size={26}/></Button><Button className={screen === "notificacoes" ? "active" : ""} onClick={() => go("notificacoes")}><Icon name="bell"/><span>Avisos</span><i>4</i></Button><Button className={screen === "perfil" ? "active" : ""} onClick={() => go("perfil")}><Icon name="user"/><span>Perfil</span></Button></div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("feed");
  const [composer, setComposer] = useState(false);
  const titles = useMemo<Record<Screen,string>>(() => ({ feed: "Início", mapa: "Mapa", salvos: "Salvos", notificacoes: "Notificações", transparencia: "Transparência", perfil: "Perfil", seguranca: "Segurança", configuracoes: "Configurações" }), []);
  const content = {
    feed: <Feed openComposer={() => setComposer(true)} />,
    mapa: <MapScreen />,
    salvos: <Saved />,
    notificacoes: <Notifications />,
    transparencia: <Transparency />,
    perfil: <Profile />,
    seguranca: <Safety />,
    configuracoes: <Settings />,
  }[screen];
  return (
    <div className="app-shell">
      <Sidebar screen={screen} go={setScreen} openComposer={() => setComposer(true)} />
      <main>
        <Header title={titles[screen]} screen={screen} go={setScreen} />
        <div className={`content ${screen === "feed" ? "with-rail" : ""}`}><div className="primary-content">{content}</div>{screen === "feed" && <RightRail go={setScreen} />}</div>
      </main>
      <BottomNav screen={screen} go={setScreen} openComposer={() => setComposer(true)} />
      {composer && <Composer close={() => setComposer(false)} />}
    </div>
  );
}
