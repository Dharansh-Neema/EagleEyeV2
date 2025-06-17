require('dotenv').config();
function setCookie(res, value) {
    option={
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }
    const name="token"
    res.cookie(name, value, option);
}

module.exports={
    setCookie
}
    