import { Link } from 'react-router-dom';
import Svg403 from './images/403.svg';
import './index.scss';

const Forbidden = () => {
  const message = "对不起，禁止访问当前页面，请不要进行非法操作！您可以返回主页面。";

  return (
    <div className="error-page">
      <div className="error-show">
        <img src={Svg403} className="img" alt="403" />
        <h1>403错误!</h1>
        <h2>禁止访问！</h2>
        <p>{message}</p>
        <Link to="/">
          <span className="go">回到首页</span>
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;