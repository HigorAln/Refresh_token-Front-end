import axios, { AxiosError } from "axios";
import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedRequestQueue: any = [];

export const setupApiCLient = (ctx: any = null) => {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:5000",
    // usando o headers: Authorization para mandar os tokens por que vamos interceptar o erro
    headers: {
      Authorization: `Bearer ${cookies["@app-token"]}`,
    },
  });

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error?.response?.status === 401) {
        cookies = parseCookies(ctx);

        const { "@app-refresh_token": refresh_token } = cookies;
        // Aqui dentro tem toda a condifiguração de requisicao que foi feita para o back-end
        // todas as informacoes para repetir a requisicao
        const originalConfig = error.config;

        // O REFRESH TOKEN SO VAI ACONTECER 1 VEZ, IDEPENDENTE DE QUANTAS CHAMADAS FOREM FEITAS
        if (!isRefreshing) {
          isRefreshing = true;

          api
            .post("/refresh-token", {
              refresh_token,
            })
            .then((response) => {
              const { token } = response.data;

              setCookie(ctx, "@app-token", token);

              api.defaults.headers["Authorization"] = `Bearer ${token}`;

              // chamando a fila de requisicoes que estavam na espera
              failedRequestQueue.forEach((request: any) =>
                request.onSuccess(token)
              );
              // limpando a fila de espera
              failedRequestQueue = [];
            })
            .catch((err) => {
              // dando erro nas requicioes que estava esperando
              failedRequestQueue.forEach((request: any) =>
                request.onFailure(err)
              );
              // limpando a fila de esperana
              failedRequestQueue = [];

              //Realizando o redirecionamento
              if (process.browser) {
                destroyCookie(ctx, "@app-refresh_token");
                destroyCookie(ctx, "@app-token");
                Router.push("/");
              } else {
                return Promise.reject(new AuthTokenError());
              }
            })
            .finally(() => {
              isRefreshing = false;
            });
        }
        //  O AXIOS NAO SUPORTA ASYNC AWAIT POR ISSO RETORNANDO UMA NOVA PROMISE

        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            // deu certo
            onSuccess: (token: string) => {
              if (originalConfig.headers) {
                // atualizando o novo token
                originalConfig.headers["Authorization"] = `Bearer ${token}`;
                // chamando novamente a api
                resolve(api(originalConfig));
              }
            },
            // deu falha
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      } else {
        // Qualquer error que tenha acontecido que nao seja do erro 401
        // Deslogando o usuario
        // process.browser e garantindo que o usuario esteja no client e nao no server
        if (process.browser) {
          destroyCookie(ctx, "@app-refresh_token");
          destroyCookie(ctx, "@app-token");
          Router.push("/");
        } else {
          return Promise.reject(new AuthTokenError());
        }
      }
      // Usando esse return promise para que caso seja outro erro diferente, ele so deixe retornar para a aplicacao
      return Promise.reject(error);
    }
  );

  return api;
};
