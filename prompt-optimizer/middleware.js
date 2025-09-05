import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * 匹配除以下路径之外的所有路径:
     * - api routes (以 /api/ 开头)
     * - 静态文件 (以 . 结尾)
     * - 其他静态资源
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets/|.*\\.).*)' 
  ],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // First handle authentication if enabled
  const authResult = handleAuthentication(request, pathname);
  if (authResult) return authResult;

  // Create enhanced response with advanced features
  const response = NextResponse.next();

  // Add security headers
  addSecurityHeaders(response);

  // Add performance headers
  addPerformanceHeaders(response, request);

  // Geo-based routing and features
  handleGeoRouting(request, response);

  // Rate limiting for API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = handleRateLimit(request, response);
    if (rateLimitResult) return rateLimitResult;
  }

  // A/B Testing for feature flags
  handleABTesting(request, response);

  // Analytics and monitoring
  addAnalyticsHeaders(response, request);

  // Bot detection and handling
  handleBotRequests(request, response);

  return response;
}

/**
 * Handle authentication (preserving existing functionality)
 */
function handleAuthentication(request, pathname) {
  // 访问环境变量
  const accessPassword = process.env.ACCESS_PASSWORD;
  
  // 如果没有设置密码，直接允许访问
  if (!accessPassword) {
    return null; // 继续处理请求
  }

  // 检查认证状态
  const cookieHeader = request.headers.get('cookie');
  let authenticated = false;
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const accessTokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('vercel_access_token=')
    );
    
    if (accessTokenCookie) {
      const accessToken = accessTokenCookie.split('=')[1];
      authenticated = accessToken === accessPassword;
    }
  }
  
  // 如果已认证，允许访问
  if (authenticated) {
    return null; // 继续处理请求
  }

  // 获取浏览器语言设置
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferChinese = acceptLanguage.includes('zh');

  // 未认证，返回认证页面
  return new Response(generateAuthPage(preferChinese), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response) {
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: wss:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests"
    ].join('; '),
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'ambient-light-sensor=()',
      'accelerometer=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'picture-in-picture=(*)'
    ].join(', ')
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

/**
 * Add performance-related headers
 */
function addPerformanceHeaders(response, request) {
  // Early hints for resource preloading
  response.headers.set('Link', [
    '</api/optimize>; rel=preconnect',
    '</static/fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
    '</static/css/main.css>; rel=preload; as=style'
  ].join(', '));

  // Server timing for performance monitoring
  const serverTiming = [
    'middleware;dur=0',
    `geo;desc="${request.geo?.country || 'unknown'}"`,
    `region;desc="${request.geo?.region || 'unknown'}"`
  ];
  response.headers.set('Server-Timing', serverTiming.join(', '));
}

/**
 * Handle geo-based routing and feature flags
 */
function handleGeoRouting(request, response) {
  const country = request.geo?.country || 'US';
  const region = request.geo?.region || 'unknown';
  const city = request.geo?.city || 'unknown';

  // Set geo headers for client-side usage
  response.headers.set('X-User-Country', country);
  response.headers.set('X-User-Region', region);
  response.headers.set('X-User-City', city);

  // Enable region-specific features
  const geoFeatures = {
    'US': ['analytics', 'premium-models', 'collaboration'],
    'EU': ['analytics', 'gdpr-compliance', 'data-residency'],
    'CN': ['baidu-models', 'local-storage'],
    'default': ['analytics', 'basic-models']
  };

  const features = geoFeatures[country] || geoFeatures.default;
  response.headers.set('X-Enabled-Features', features.join(','));

  // Set timezone hint
  const timezoneMap = {
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'DE': 'Europe/Berlin',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'AU': 'Australia/Sydney'
  };
  
  const timezone = timezoneMap[country] || 'UTC';
  response.headers.set('X-Suggested-Timezone', timezone);
}

/**
 * Handle rate limiting for API endpoints
 */
function handleRateLimit(request, response) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Simple rate limiting logic (in production, use Redis or KV storage)
  const rateLimitKey = `${ip}:${request.nextUrl.pathname}`;
  
  // For demo purposes, allow higher limits for known good bots
  const isBot = /bot|crawl|spider/i.test(userAgent);
  const baseLimit = isBot ? 100 : 60; // requests per minute
  
  // Set rate limit headers
  response.headers.set('X-RateLimit-Limit', baseLimit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.floor(Math.random() * baseLimit).toString());
  response.headers.set('X-RateLimit-Reset', (Date.now() + 60000).toString());
  
  // In a real implementation, check actual rate limit here
  return null; // No rate limit exceeded
}

/**
 * Handle A/B testing and feature flags
 */
function handleABTesting(request, response) {
  const pathname = request.nextUrl.pathname;
  
  // Skip A/B testing for API routes
  if (pathname.startsWith('/api/')) return;
  
  // Generate user bucket based on IP hash (for consistency)
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const bucket = hashString(ip) % 100; // 0-99
  
  // Define A/B tests
  const experiments = {
    'ui-redesign': bucket < 50 ? 'control' : 'variant', // 50/50 split
    'premium-cta': bucket < 25 ? 'aggressive' : bucket < 75 ? 'subtle' : 'control', // 25/50/25 split
    'optimization-algorithm': bucket < 10 ? 'experimental' : 'standard' // 10/90 split
  };
  
  // Set experiment headers for client-side usage
  Object.entries(experiments).forEach(([experiment, variant]) => {
    response.headers.set(`X-Experiment-${experiment}`, variant);
  });
  
  // Set overall experiment bucket
  response.headers.set('X-User-Bucket', bucket.toString());
}

/**
 * Add analytics and monitoring headers
 */
function addAnalyticsHeaders(response, request) {
  const sessionId = generateSessionId();
  const requestId = generateRequestId();
  
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Session-ID', sessionId);
  
  // Track request metadata
  response.headers.set('X-Request-Time', Date.now().toString());
  response.headers.set('X-User-Agent-Hash', hashString(request.headers.get('user-agent') || '').toString());
  
  // Performance monitoring flags
  if (process.env.VERCEL_ENV === 'production') {
    response.headers.set('X-Analytics-Enabled', 'true');
    response.headers.set('X-Speed-Insights-Enabled', 'true');
  }
}

/**
 * Handle bot requests with special treatment
 */
function handleBotRequests(request, response) {
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /bot|crawl|spider|facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent);
  
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow');
    response.headers.set('X-Bot-Detected', 'true');
    
    // Add structured data hints for social media bots
    if (/facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent)) {
      response.headers.set('X-Social-Bot', 'true');
    }
    
    // Provide bot-friendly cache headers
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
  } else {
    response.headers.set('X-Bot-Detected', 'false');
  }
}

/**
 * Utility functions
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateRequestId() {
  return 'req_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateAuthPage(isChinese = true) {
  // 语言文本对象
  const text = {
    title: isChinese ? '访问验证 - Prompt Optimizer' : 'Access Verification - Prompt Optimizer',
    heading: 'Prompt Optimizer',
    subtitle: isChinese ? '此站点受密码保护' : 'This site is password protected',
    passwordLabel: isChinese ? '访问密码' : 'Access Password',
    passwordPlaceholder: isChinese ? '请输入访问密码' : 'Enter access password',
    submitButton: isChinese ? '验证并访问' : 'Verify & Access',
    loading: isChinese ? '验证中，请稍候...' : 'Verifying, please wait...',
    footer: isChinese ? '安全访问控制 | Powered by Vercel' : 'Secure Access Control | Powered by Vercel',
    errorNetwork: isChinese ? '网络错误，请重试' : 'Network error, please try again',
  };

  return `
<!DOCTYPE html>
<html lang="${isChinese ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${text.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
        }
        
        .auth-modal {
            background: white;
            padding: 2.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 400px;
            text-align: center;
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .logo {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #667eea;
        }
        
        h1 {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        
        input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .submit-btn {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .submit-btn:hover:not(:disabled) {
            background: #5a6fd8;
        }
        
        .submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .error-message {
            color: #e74c3c;
            margin-top: 1rem;
            font-size: 0.9rem;
            display: none;
            padding: 0.5rem;
            background: #ffeaea;
            border-radius: 4px;
            border-left: 4px solid #e74c3c;
        }
        
        .loading {
            display: none;
            margin-top: 1rem;
            color: #667eea;
        }
        
        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            font-size: 0.8rem;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="auth-modal">
        <div class="logo">🚀</div>
        <h1>${text.heading}</h1>
        <p class="subtitle">${text.subtitle}</p>
        
        <form id="authForm">
            <div class="form-group">
                <label for="password">${text.passwordLabel}</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    placeholder="${text.passwordPlaceholder}"
                    autocomplete="current-password"
                >
            </div>
            
            <button type="submit" class="submit-btn" id="submitBtn">
                <span id="btnText">${text.submitButton}</span>
            </button>
            
            <div class="error-message" id="errorMessage"></div>
            <div class="loading" id="loading">${text.loading}</div>
        </form>
        
        <div class="footer">
            ${text.footer}
        </div>
    </div>

    <script>
        const form = document.getElementById('authForm');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const errorMessage = document.getElementById('errorMessage');
        const loading = document.getElementById('loading');
        const passwordInput = document.getElementById('password');
        
        // 语言设置
        const isChinese = document.documentElement.lang === 'zh-CN';
        const errorMessages = {
            network: '${text.errorNetwork}',
            invalidPassword: isChinese ? '密码错误，请重试' : 'Invalid password, please try again'
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = passwordInput.value.trim();
            if (!password) return;

            // 显示加载状态
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            loading.style.display = 'block';
            errorMessage.style.display = 'none';

            try {
                console.log('开始验证密码');
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        action: 'verify',
                        password: password
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // 认证成功，刷新页面
                    window.location.reload();
                } else {
                    // 认证失败
                    console.log('认证失败', { message: data.message });
                    errorMessage.textContent = data.message || errorMessages.invalidPassword;
                    errorMessage.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('认证请求失败:', error);
                errorMessage.textContent = errorMessages.network;
                errorMessage.style.display = 'block';
            } finally {
                // 恢复按钮状态
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                loading.style.display = 'none';
            }
        });

        // 密码输入框获得焦点
        passwordInput.focus();

        // 清除错误信息当用户开始输入
        passwordInput.addEventListener('input', () => {
            errorMessage.style.display = 'none';
        });
        
        // 按ESC键聚焦到密码输入框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                passwordInput.focus();
                errorMessage.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
} 