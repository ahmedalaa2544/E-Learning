export const ConfirmTemp = (link) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    "
  >
    <div
      class="container"
      style="
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        text-align: center;
        padding: 40px;
        max-width: 470px;
        margin: auto;
      "
    >
      <div>
        <img
          src="https://elearningtest123.blob.core.windows.net/upload/photo1714479762.jpeg"
          alt="mail icon"
          style="max-width: 100%; height: auto"
        />
      </div>

      <h1 style="color: #000; font-size: 24px; margin-top: 0">
        Email Confirmation
      </h1>

      <p style="color: #555; font-size: 16px; margin: 10px 0">
        We are delighted to welcome you to
        <span style="color: #007d53; font-weight: 800; font-size: 1.1em"
          >Educative</span
        >, and we're excited that you've chosen us as your partner on your
        educational journey. This is the first step towards unlocking new
        opportunities and broadening your horizons through learning.
      </p>

      <p style="color: #555; font-size: 16px; margin: 10px 0">
        To get started, please confirm your email address by clicking the button
        below.
      </p>

      <a
        href="${link}"
        style="
          display: inline-block;
          background-color: #007d53;
          color: #fff;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-size: 18px;
          margin-top: 20px;
        "
        >Confirm Account</a
      >
    </div>
  </body>
</html>`;

export const resetPassTemp = (code) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            background-color: #fff;
            max-width: 600px;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            margin: auto;
        }

        h1 {
            color: #333;
        }

        p {
            color: #666;
        }

        .code {
            font-size: 28px;
            font-weight: bold;
            color: #007d53;
            margin-top: 20px;
        }

        .btn {
            display: inline-block;
            background-color: #007BFF;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://lh3.googleusercontent.com/u/1/drive-viewer/AK7aPaBGA_VflTJx5K4MQ7dysyZxiVGXL30T0ayacEq2fQ7vazkn8f7-kB2u9ySZeLvHBXofKjy4Lz65aTdPeo_cpCEhlbiVPg=w1360-h599" alt="mail icon">
        <h1>Forgot Password</h1>
        <p>We received a request to reset your password. Please use the following code to reset your password:</p>
        <div class="code">${code}</div>
        <p>If you did not request this, you can ignore this email.</p>
    </div>
</body>
</html>

`;
