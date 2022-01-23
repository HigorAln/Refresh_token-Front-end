import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { parseCookies, destroyCookie } from "nookies";

export function withSSRAuth<P>(fn: GetServerSideProps<P>) {
  return async (
    ctx: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const { ["@app-token"]: token } = parseCookies(ctx);

    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // fazendo tratamento de erro para saber o erro que deu dentro da aplicacao foi de autenticacao
    try {
      return await fn(ctx);
    } catch (err) {
      destroyCookie(ctx, "@app-token");
      destroyCookie(ctx, "@app-refresh_token");

      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
  };
}
