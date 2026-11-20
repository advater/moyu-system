import { Link } from 'react-router-dom';
import './index.scss';

const Unauthorized = () => {
  const message = "对不起，您没有访问权限，请不要进行非法操作！您可以返回主页面。";

  return (
    <div className="error-page">
      <div className="error-show">
        <h1>401错误!</h1>
        <h2>未授权！</h2>
        <p>{message}</p>
        <Link to="/">
          <span className="go">回到首页</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;