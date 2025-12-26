import { cache } from "react";

import { getSession } from "./cognito";

/**
 * サーバーサイドでセッションを取得
 * cache()を使用してリクエストごとに1回だけ実行されるようにする
 */
const auth = cache(getSession);

export { auth };
