import { redirect } from "next/navigation";

/** La raíz de la app abre el menú demo (los dominios propios se resuelven en el middleware). */
export default function Home() {
  redirect(`/menu/${process.env.DEFAULT_MENU_SLUG || "molienda"}`);
}
