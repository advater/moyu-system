import { Link } from 'react-router-dom';
import Svg404 from './images/404.svg';
import './index.scss';

const NotFound = () => {
  const message = "对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。";

  return (
    <div className="error-page">
      <div className="error-show">
        <img src={Svg404} className="img" alt="404" />
        <h1>404错误!</h1>
        <h2>未找到网页！</h2>
        <p>{message}</p>
        <Link to="/">
          <span className="go">回到首页</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;