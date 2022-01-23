import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { parseCookies } from "nookies";

// O next espera que ele chame uma funcao.. por isso estamos chamando uma funcao que esta declarando o ctx
// e esta retornando uma outra funcao que esta recebendo o ctx
// Esse <P> e o tipo de retorno que ele espera que a funcao tenha... por padrao quando nao sabemos, nao colocamos nada na pagina principal, porem nos colocamos aqui
export function withSSRGuest<P>(fn: GetServerSideProps<P>) {
  // aqui estamos usando um sistema chamando hightOrderFunction, que seria uma funcao que retornaria outra
  // este retorn e oque o next vai acessar quando ele iniciar a pagina
  return async (
    ctx: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const { ["@app-token"]: token } = parseCookies(ctx);

    if (token) {
      return {
        redirect: {
          destination: "/dashboard",
          permanent: false,
        },
      };
    }
    // caso o token nao exista... ele continue executando a funcao que esta sendo passada na propria pagina
    return await fn(ctx);
  };
}
