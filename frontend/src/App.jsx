import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router";
import {
  Cpu,
  Search,
  Menu,
  ChevronDown,
  BookOpen,
  UserRound,
  ShoppingCart,
} from "lucide-react";
import ServiceStatus from "./components/ServiceStatus.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProductPage, { NotFoundPage } from "./pages/ProductPage.jsx";
import { departments } from "./data/products.js";
import { getCatalog } from "./api/client.js";
import { AuthPage, AccountPage } from "./pages/AccountPage.jsx";
import { useAuth, RequireUser } from "./context/AuthContext.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AdminInventoryPage from "./pages/AdminInventoryPage.jsx";
import BuilderPage from "./pages/BuilderPage.jsx";
import MyBuildsPage from "./pages/MyBuildsPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import { OrdersPage, OrderPage } from "./pages/OrdersPage.jsx";
import PerformanceBenchPage from "./pages/PerformanceBenchPage.jsx";
import { useRealtime } from "./context/RealtimeContext.jsx";
import AdminGamesPage from "./pages/AdminGamesPage.jsx";
import { useCart } from "./context/CartContext.jsx";
import CartPage from "./pages/CartPage.jsx";
import CartCheckoutPage from "./pages/CartCheckoutPage.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import StoreSearch from "./components/StoreSearch.jsx";
import "./shopping-experience.css";
import AmbientBackground from "./components/AmbientBackground.jsx";
import BattlePage from "./pages/BattlePage.jsx";
import RankingPage from "./pages/RankingPage.jsx";
import PublicBuildPage from "./pages/PublicBuildPage.jsx";
import MyPublicationsPage from "./pages/MyPublicationsPage.jsx";
import BenchmarkReferencesPage from "./pages/BenchmarkReferencesPage.jsx";
import "./community.css";
import "./battle.css";

export default function App() {
  const auth = useAuth();
  const shopping = useCart();
  const realtime = useRealtime();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getCatalog(controller.signal, { force: attempt > 0 })
      .then((items) => {
        if (!controller.signal.aborted) setProducts(items);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Não foi possível carregar os produtos. Confira a conexão e tente novamente.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const product = products.find(
      (item) => `/produto/${item.slug}` === location.pathname,
    );
    const titles = {
      "/ranking": "Ranking da comunidade",
      "/minhas-publicacoes": "Minhas publicações",
      "/referencias-fps": "FPS em jogos",
      "/carrinho": "Meu carrinho",
      "/checkout": "Finalizar pedido",
      "/montar": "Minha bancada de montagem",
      "/entrar": "Entrar na conta",
      "/conta": "Minha conta",
      "/cadastro": "Criar conta",
      "/minhas-montagens": "Minhas montagens",
      "/pedidos": "Meus pedidos",
      "/admin": "Administração",
      "/admin/estoque": "Estoque de produtos",
      "/admin/jogos": "Cenários didáticos",
      "/combate": "Combate de PCs e notebooks",
    };
    const routeTitle =
      titles[location.pathname] ||
      (location.pathname.startsWith("/pedidos/")
        ? "Detalhes do pedido"
        : location.pathname.startsWith("/ranking/")
          ? "Montagem da comunidade"
          : location.pathname.startsWith("/finalizar/")
            ? "Finalizar montagem"
            : location.pathname.startsWith("/bancada/")
              ? "Bancada didática"
              : "Página não encontrada");
    document.title = product
      ? `${product.name} | DreamBuild PC`
      : location.pathname === "/"
        ? "DreamBuild PC | Hardware e montagem de PCs"
        : `${routeTitle} | DreamBuild PC`;
  }, [location.pathname, products, loading]);
  useEffect(() => {
    if (loading) return;
    // O catálogo pode terminar de carregar enquanto a pessoa já digita num
    // formulário (ex.: /cadastro). Não tiramos o foco nem rolamos a página.
    const active = document.activeElement;
    if (active?.matches?.("input, textarea, select, [contenteditable='true']"))
      return;
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      target?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
      document.getElementById("conteudo")?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash, loading]);

  function browse(id) {
    setCategory(id);
    navigate("/#produtos");
    requestAnimationFrame(() =>
      document.getElementById("produtos")?.scrollIntoView(),
    );
  }
  function clearFilters() {
    setCategory("all");
    setQuery("");
  }
  async function refreshCatalog() {
    setProducts(
      await getCatalog(new AbortController().signal, { force: true }),
    );
  }
  useEffect(() => {
    const refresh = () => refreshCatalog().catch(() => {});
    window.addEventListener("dreambuild:inventory", refresh);
    return () => window.removeEventListener("dreambuild:inventory", refresh);
  }, []);
  const catalogState = loading ? (
    <section className="catalog-load-state" role="status">
      <h1>Carregando produtos...</h1>
      <p>Consultando o catálogo da loja.</p>
    </section>
  ) : error ? (
    <section className="catalog-load-state" role="alert">
      <h1>Catálogo indisponível</h1>
      <p>{error}</p>
      <button
        className="primary-button"
        type="button"
        onClick={() => setAttempt((value) => value + 1)}
      >
        Tentar novamente
      </button>
    </section>
  ) : null;

  return (
    <>
      <AmbientBackground />
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="utility-strip">
        <div className="page-shell">
          <span>Projeto acadêmico. Todas as compras serão simuladas.</span>
          <a href="#sobre">Sobre o DreamBuild</a>
        </div>
      </div>
      <header className="store-header">
        <div className="page-shell header-main">
          <Link className="brand" to="/" aria-label="DreamBuild PC, início">
            <Cpu size={35} strokeWidth={1.7} aria-hidden="true" />
            <span>
              dream<strong>build</strong>
              <small>Hardware & montagem de PCs</small>
            </span>
          </Link>
          <StoreSearch
            products={products}
            value={query}
            onChange={setQuery}
            onSubmit={() => browse("all")}
            loading={loading}
          />
          <Link className="header-guide-link" to="/#guia">
            <BookOpen size={24} aria-hidden="true" />
            <span>
              Precisa de ajuda?<strong>Conheça as peças</strong>
            </span>
          </Link>
          <ThemeToggle />
          <Link
            className="header-cart-link"
            to="/carrinho"
            aria-label={`Meu carrinho, ${shopping.cart?.itemCount || 0} itens`}
          >
            <span>
              <ShoppingCart size={24} />
              <b>{shopping.cart?.itemCount || 0}</b>
            </span>
            <span>
              Meu<small>carrinho</small>
            </span>
          </Link>
          <Link
            className="header-account-link"
            to={auth.user ? "/conta" : "/entrar"}
          >
            <UserRound size={23} aria-hidden="true" />
            <span>
              {auth.user ? auth.user.name.split(" ")[0] : "Entrar"}
              <small>Minha conta</small>
            </span>
          </Link>
        </div>
        <nav className="department-nav" aria-label="Departamentos">
          <div className="page-shell">
            <Link className="builder-nav-link" to="/montar">
              Monte seu PC
            </Link>
            <details className="department-menu">
              <summary>
                <Menu size={18} aria-hidden="true" />
                Departamentos
                <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div>
                {departments.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(event) => {
                      browse(item.id);
                      event.currentTarget.closest("details").open = false;
                    }}
                  >
                    {item.name}
                  </button>
                ))}
                <Link to="/#guia">Guia das oito categorias</Link>
              </div>
            </details>
            <button type="button" onClick={() => browse("cpu")}>
              Processadores
            </button>
            <button type="button" onClick={() => browse("gpu")}>
              Placas de vídeo
            </button>
            <button type="button" onClick={() => browse("ram")}>
              Memórias
            </button>
            <button type="button" onClick={() => browse("storage")}>
              SSDs
            </button>
            <Link to="/#guia">
              <BookOpen size={17} aria-hidden="true" />
              Guia de hardware
            </Link>
            <Link to="/combate">PCs prontos e combate</Link>
            <Link to="/ranking">Ranking de PCs</Link>
          </div>
        </nav>
      </header>
      <main id="conteudo" className="page-shell" tabIndex={-1}>
        {products.localSnapshot && (
          <p className="catalog-update-notice" role="status">
            O banco atingiu um limite de consultas. A vitrine usa fichas e
            cotações locais verificadas; salvar e finalizar continuam exigindo
            validação no banco.
            <button
              type="button"
              className="text-button"
              onClick={() => setAttempt((v) => v + 1)}
            >
              Atualizar vitrine
            </button>
          </p>
        )}
        {realtime.catalogUpdate && (
          <div className="catalog-update-notice" role="status">
            <span>O catálogo foi atualizado pela administração.</span>
            <button
              className="text-button"
              type="button"
              onClick={async () => {
                await refreshCatalog();
                realtime.clearCatalogUpdate();
              }}
            >
              Atualizar produtos
            </button>
          </div>
        )}
        <Routes>
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/ranking/:id" element={<PublicBuildPage />} />
          <Route
            path="/referencias-fps"
            element={<BenchmarkReferencesPage />}
          />
          <Route
            path="/minhas-publicacoes"
            element={
              <RequireUser>
                <MyPublicationsPage />
              </RequireUser>
            }
          />
          <Route
            path="/combate"
            element={<BattlePage showQuotaNotice={!products.localSnapshot} />}
          />
          <Route path="/carrinho" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <RequireUser>
                <CartCheckoutPage />
              </RequireUser>
            }
          />
          <Route
            path="/"
            element={
              catalogState || (
                <HomePage
                  products={products}
                  category={category}
                  onCategoryChange={browse}
                  query={query}
                  onClear={clearFilters}
                />
              )
            }
          />
          <Route
            path="/produto/:slug"
            element={
              catalogState || (
                <ProductPage
                  products={products}
                  key={location.pathname}
                  onBrowseCategory={browse}
                />
              )
            }
          />
          <Route path="/entrar" element={<AuthPage key="login" />} />
          <Route
            path="/cadastro"
            element={<AuthPage key="register" register />}
          />
          <Route path="/conta" element={<AccountPage />} />
          <Route
            path="/admin"
            element={
              <RequireUser role="ADMIN">
                <AdminPage
                  products={products}
                  refreshCatalog={refreshCatalog}
                />
              </RequireUser>
            }
          />
          <Route
            path="/admin/jogos"
            element={
              <RequireUser role="ADMIN">
                <AdminGamesPage />
              </RequireUser>
            }
          />
          <Route
            path="/admin/estoque"
            element={
              <RequireUser role="ADMIN">
                <AdminInventoryPage
                  products={products}
                  refreshCatalog={refreshCatalog}
                />
              </RequireUser>
            }
          />
          <Route
            path="/montar"
            element={
              catalogState || (
                <BuilderPage
                  products={products}
                  onCatalogRefresh={refreshCatalog}
                />
              )
            }
          />
          <Route
            path="/minhas-montagens"
            element={
              <RequireUser>
                <MyBuildsPage />
              </RequireUser>
            }
          />
          <Route
            path="/finalizar/:buildId"
            element={
              <RequireUser>
                <CheckoutPage />
              </RequireUser>
            }
          />
          <Route
            path="/pedidos"
            element={
              <RequireUser>
                <OrdersPage />
              </RequireUser>
            }
          />
          <Route
            path="/pedidos/:id"
            element={
              <RequireUser>
                <OrderPage />
              </RequireUser>
            }
          />
          <Route
            path="/bancada/:buildId"
            element={
              <RequireUser>
                <PerformanceBenchPage />
              </RequireUser>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="store-footer" id="sobre">
        <div className="page-shell footer-main">
          <div>
            <Link className="footer-brand" to="/">
              dream<strong>build</strong>
            </Link>
            <p>
              Projeto de Breno Dantas e Kaio Marques para Programação Web
              Avançada.
            </p>
            <p>
              Compras simuladas. As ofertas são apresentadas quando cadastradas.
            </p>
            <p className="manufacturer-rights">
              Marcas e imagens de produto pertencem aos respectivos fabricantes.
            </p>
          </div>
          <ServiceStatus />
          {!auth.loading && auth.user?.role === "ADMIN" && (
            <a href="/api-docs/" target="_blank" rel="noreferrer">
              Documentação da API
            </a>
          )}
        </div>
      </footer>
    </>
  );
}
