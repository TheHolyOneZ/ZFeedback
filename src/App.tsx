import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence } from "motion/react";
import { TitleBar } from "./components/TitleBar";
import { SearchBar } from "./components/SearchBar";
import { Storefront } from "./views/Storefront";
import { Grid } from "./views/Grid";
import { DetailSheet } from "./views/DetailSheet";
import type { FeedbackKind } from "./views/DetailSheet";
import { SignInPanel } from "./components/SignInPanel";
import { ComposeTicket } from "./views/ComposeTicket";
import { MyTickets } from "./views/MyTickets";
import { RequestBoard } from "./views/RequestBoard";
import { GuildGate } from "./components/GuildGate";
import { LinkFallback } from "./components/LinkFallback";
import { AboutHost } from "./components/About";
import { Scroll } from "./components/Scroll";
import { ModeSwap } from "./components/ModeSwap";
import { FirstRun } from "./components/FirstRun";
import { Welcome, welcomeDone } from "./components/Welcome";
import { Launch } from "./components/Launch";
import { Tour, tourDone, markTourDone } from "./components/Tour";
import type { TourStep } from "./components/Tour";
import { feedUpdates, serverProjects } from "./lib/tickets";
import type { ServerProject, TicketType } from "./lib/tickets";
import { AccountButton } from "./components/AccountButton";
import { getSession, onSignedOut, signOut } from "./lib/auth";
import type { PublicUser } from "./lib/auth";
import { search } from "./lib/search";
import {
  cachedCatalogue,
  categories,
  onCatalogueOffline,
  onCatalogueUpdated,
  refreshCatalogue,
} from "./lib/catalogue";
import type { Catalogue, Project } from "./lib/types";
import "./App.css";

export default function App() {
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [signingIn, setSigningIn] = useState(false);


  const [serverCat, setServerCat] = useState<ServerProject[]>([]);
  const [compose, setCompose] = useState<{ project: Project | null; kind: TicketType } | null>(null);
  const [showTickets, setShowTickets] = useState(false);


  const [tab, setTab] = useState<"apps" | "wanted">("apps");


  const [needsGuild, setNeedsGuild] = useState<string | null>(null);
  const [needsReply, setNeedsReply] = useState(0);


  const [wantedCount, setWantedCount] = useState(0);


  const [sessionKnown, setSessionKnown] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAbout, setShowAbout] = useState(false);


  const [launching, setLaunching] = useState(true);
  const [tour, setTour] = useState(false);

  useEffect(() => {
    let alive = true;


    (async () => {
      const cached = await cachedCatalogue().catch(() => null);
      if (alive && cached) {
        setCat(cached);
        setLoading(false);
      }
      if (!cached) {
        const fresh = await refreshCatalogue().catch(() => null);
        if (alive) {
          setCat(fresh);
          setLoading(false);
        }
      }
    })();

    const un1 = onCatalogueUpdated((c) => {
      if (alive) {
        setCat(c);
        setLoading(false);
      }
    });
    const un2 = onCatalogueOffline(() => {
      if (alive) setCat((c) => (c ? { ...c, stale: true } : c));
    });


    getSession()
      .then((s) => {
        if (!alive) return;
        setUser(s.user);
        setSessionKnown(true);

        if (!s.user && !welcomeDone()) setShowWelcome(true);
      })
      .catch(() => {
        if (!alive) return;
        setSessionKnown(true);
        if (!welcomeDone()) setShowWelcome(true);
      });


    const un3 = onSignedOut(() => alive && setUser(null));


    const un4 = listen("tray:open-tickets", () => alive && setShowTickets(true));
    const un5 = listen<string>("auth:needs-guild", (e) => {
      if (alive) setNeedsGuild(e.payload || "https://discord.gg/wmPWPSnaAW");
    });

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        invoke("app_ready").catch(() => {});
      }),
    );

    return () => {
      alive = false;
      un1.then((f) => f());
      un2.then((f) => f());
      un3.then((f) => f());
      un4.then((f) => f());
      un5.then((f) => f());
    };
  }, []);


  useEffect(() => {
    if (!user) {
      setServerCat([]);
      setNeedsReply(0);
      return;
    }
    let alive = true;

    serverProjects()
      .then((r) => alive && setServerCat(r.projects))
      .catch(() => {});

    const pull = () =>
      feedUpdates()
        .then((r) => {
          if (!alive) return;
          setNeedsReply(r.counts.needs_reply);

          invoke("tray_set_pending", { count: r.counts.needs_reply }).catch(() => {});
        })
        .catch(() => {});

    pull();


    const timer = setInterval(pull, 60_000);
    window.addEventListener("focus", pull);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", pull);
    };
  }, [user]);

  const cats = useMemo(() => (cat ? categories(cat) : []), [cat]);


  const slugFor = (p: Project): string | null =>
    serverCat.find((sp) => sp.title === p.title)?.slug ?? (serverCat.length ? null : p.slug);


  const filtering =
    tab === "wanted" ? query.trim().length > 0 : query.trim().length > 0 || category !== null;

  const hits = useMemo(() => {
    if (!cat) return [];
    const pool = category
      ? cat.projects.filter((p) => (p.category ?? "Other") === category)
      : cat.projects;
    return search(pool, query);
  }, [cat, query, category]);


  const tourSteps: TourStep[] = useMemo(() => [
    {
      id: "search",
      target: ".sb-field",
      title: "Find anything, fast",
      body: "Fifty tools is a lot to scroll. Type here, or press Ctrl K from anywhere in the app.",
      before: () => { setTab("apps"); setQuery(""); },
    },
    {
      id: "categories",
      target: ".sb-chips",
      title: "Or browse by what it does",
      body: "Every category, with how many tools are in it. Picking one switches from browsing to a dense grid.",
    },
    {
      id: "wanted",
      target: ".sb-tabs",
      title: "Wanted: tools that don't exist yet",
      body: "Anyone can describe a tool they wish existed, and vote for other people's. The most wanted ones get built.",
      before: () => setTab("wanted"),
    },
    {
      id: "request",
      target: ".rb-new",
      title: "Ask for one yourself",
      body: "Describe it in a sentence. If enough people want the same thing, that is the queue.",
    },
    {


      id: "types",
      target: ".cmp-types",
      title: "Three kinds of request",
      body: "Bug for something broken. Feature for a tool that should do more. App request for one that doesn't exist yet — those go on the Wanted board.",
      before: () => { setTab("apps"); setCompose({ project: null, kind: "bug" }); },
      pad: 10,
    },
    {
      id: "account",
      target: ".acct",
      title: "Your tickets live here",
      body: "File a bug or a feature request, then come back for the reply — a dot appears when someone has asked you a question. This tour lives in here too, under \u201cShow me around\u201d, whenever you want it again.",

      before: () => { setCompose(null); setTab("apps"); },
    },

  ], []);

  const clearAll = () => {
    setQuery("");
    setCategory(null);
  };


  const handleFeedback = (project: Project, kind: FeedbackKind) => {
    if (!user) {
      setSigningIn(true);
      return;
    }
    setSelected(null);
    setCompose({ project, kind: kind === "bug" ? "bug" : "feature" });
  };

  return (
    <div className="app-shell">
      <TitleBar play={!launching} />

      <Scroll className="app-body">
        {loading && !cat ? (
          <StorefrontSkeleton />
        ) : cat ? (
          <>
            <SearchBar
              query={query}
              onQuery={setQuery}
              categories={cats}
              active={category}
              onCategory={setCategory}
              resultCount={tab === "wanted" ? wantedCount : hits.length}
              filtering={filtering}
              tab={tab}
              onTab={user ? setTab : undefined}
              account={
                <>


                  <button
                    className="ab-open"
                    onClick={() => setShowAbout(true)}
                    title="About ZFeedback"
                    aria-label="About ZFeedback"
                  >
                    i
                  </button>
                  <AccountButton
                  user={user}
                  onSignIn={() => setSigningIn(true)}
                  onSignOut={() => signOut().then((s) => setUser(s.user))}
                  needsReply={needsReply}
                  onNewTicket={() => setCompose({ project: null, kind: "bug" })}
                  onMyTickets={() => setShowTickets(true)}
                  onTour={() => { markTourDone(); setTour(true); }}
                  onAbout={() => setShowAbout(true)}
                />
                </>
              }
            />


            <ModeSwap
              swapKey={tab === "wanted" ? "wanted" : filtering ? "grid" : "store"}
              toWanted={tab === "wanted"}
            >
              {tab === "wanted" ? (
                <RequestBoard
                  query={query}
                  onCount={setWantedCount}
                  onRequest={() => setCompose({ project: null, kind: "app_request" })}
                />
              ) : filtering ? (
                <Grid
                  hits={hits}
                  onOpen={setSelected}
                  query={query}
                  category={category}
                  onClear={clearAll}
                />
              ) : (
                <Storefront catalogue={cat} onOpen={setSelected} onSeeAll={setCategory} play={!launching} />
              )}
            </ModeSwap>
          </>
        ) : (
          <Unreachable />
        )}
      </Scroll>

      <AnimatePresence>
        {selected && (
          <DetailSheet
            key={selected.slug}
            project={selected}
            signedIn={!!user}
            onClose={() => setSelected(null)}
            onFeedback={handleFeedback}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compose && (
          <ComposeTicket
            projects={serverCat}
            initialProject={compose.project ? slugFor(compose.project) : null}
            kind={compose.kind}
            onClose={() => setCompose(null)}
            onFiled={() => {
              setCompose(null);
              setShowTickets(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTickets && <MyTickets onClose={() => setShowTickets(false)} />}

        <AnimatePresence>
          {needsGuild && (
            <GuildGate
              invite={needsGuild}
              onRetry={() => {
                setNeedsGuild(null);


                getSession().then((s) => setUser(s.user)).catch(() => {});
              }}
              onDismiss={() => setNeedsGuild(null)}
            />
          )}
        </AnimatePresence>
      </AnimatePresence>


      {sessionKnown && !showWelcome && !tour && <FirstRun />}

      <AnimatePresence>
        {showWelcome && !launching && (
          <Welcome
            invite={needsGuild ?? "https://discord.gg/wmPWPSnaAW"}
            onSignIn={() => {
              setShowWelcome(false);
              setSigningIn(true);
            }}
            onBrowse={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {signingIn && (
          <SignInPanel
            onClose={() => setSigningIn(false)}
            onSignedIn={(u) => {
              setUser(u);


              if (!tourDone()) setTimeout(() => setTour(true), 1200);


              setTimeout(() => setSigningIn(false), 900);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tour && <Tour steps={tourSteps} onClose={() => setTour(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {launching && <Launch onDone={() => setLaunching(false)} />}
      </AnimatePresence>


      <AboutHost open={showAbout} onClose={() => setShowAbout(false)} />


      <LinkFallback />

    </div>
  );
}


function StorefrontSkeleton() {
  return (
    <div className="storefront">
      <div className="sk sk-title" />
      <div className="sk sk-hero" />
      {[0, 1].map((i) => (
        <div key={i} className="sk-row">
          <div className="sk sk-rowtitle" />
          <div className="sk-rowcards">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="sk sk-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


function Unreachable() {
  return (
    <div className="unreachable">
      <h2>No connection</h2>
      <p>
        The catalogue could not be loaded and nothing is cached yet. Connect to the
        internet and reopen ZFeedback.
      </p>
      <button className="hero-btn hero-btn--primary" onClick={() => location.reload()}>
        Try again
      </button>
    </div>
  );
}
