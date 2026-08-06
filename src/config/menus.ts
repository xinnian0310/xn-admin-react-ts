import type { MenuItem } from '@/types/menu'

/** 仅作结构参考；实际菜单与图标均来自后端 /api/auth/menus（sys_route.icon） */
export const menus: MenuItem[] = [
  {
    id: 'dashboard',
    title: '首页',
    path: '/dashboard',
    permission: 'menu:dashboard',
    affix: true,
  },
  {
    id: 'personal',
    title: '个人中心',
    permission: 'menu:personal',
    children: [
      {
        id: 'profile',
        title: '个人信息',
        path: '/profile',
        permission: 'menu:profile',
      },
      {
        id: 'mine-message',
        title: '我的消息',
        path: '/messages/mine',
        permission: 'menu:personal:message',
      },
    ],
  },
  {
    id: 'monitor',
    title: '系统监控',
    permission: 'menu:monitor',
    children: [
      {
        id: 'monitor-online',
        title: '在线用户',
        path: '/monitor/online',
        permission: 'menu:monitor:online',
      },
      {
        id: 'monitor-server',
        title: '服务监控',
        path: '/monitor/server',
        permission: 'menu:monitor:server',
      },
      {
        id: 'monitor-redis',
        title: '缓存监控',
        path: '/monitor/redis',
        permission: 'menu:monitor:redis',
      },
      {
        id: 'monitor-sql',
        title: 'SQL监控',
        path: '/monitor/sql',
        permission: 'menu:monitor:sql',
      },
      {
        id: 'logs',
        title: '日志管理',
        permission: 'menu:monitor:logs',
        children: [
          {
            id: 'login-log',
            title: '登录日志',
            path: '/system/logs/login',
            permission: 'menu:system:login-log',
          },
          {
            id: 'oper-log',
            title: '操作日志',
            path: '/system/logs/oper',
            permission: 'menu:system:oper-log',
          },
          {
            id: 'exception-log',
            title: '异常日志',
            path: '/system/logs/exception',
            permission: 'menu:system:exception-log',
          },
        ],
      },
    ],
  },
  {
    id: 'system',
    title: '系统管理',
    permission: 'menu:system',
    children: [
      {
        id: 'org',
        title: '组织与账号',
        permission: 'menu:system:org',
        children: [
          {
            id: 'user',
            title: '用户管理',
            path: '/users',
            permission: 'menu:system:user',
          },
          {
            id: 'unit',
            title: '单位管理',
            path: '/system/units',
            permission: 'menu:system:unit',
          },
        ],
      },
      {
        id: 'rbac',
        title: '权限与安全',
        permission: 'menu:system:rbac',
        children: [
          {
            id: 'role-list',
            title: '角色列表',
            path: '/system/roles',
            permission: 'menu:system:role',
          },
          {
            id: 'permission',
            title: '角色权限',
            path: '/system/permissions',
            permission: 'menu:system:permission',
          },
          {
            id: 'permission-content',
            title: '权限内容',
            path: '/system/permissions-content',
            permission: 'menu:system:permission-content',
          },
          {
            id: 'route',
            title: '路由管理',
            path: '/system/routes',
            permission: 'menu:system:route',
          },
        ],
      },
      {
        id: 'content',
        title: '内容运营',
        permission: 'menu:system:content',
        children: [
          {
            id: 'notice',
            title: '公告管理',
            path: '/system/notices',
            permission: 'menu:system:notice',
          },
          {
            id: 'message',
            title: '站内信',
            path: '/system/messages',
            permission: 'menu:system:message',
          },
        ],
      },
      {
        id: 'base',
        title: '基础数据',
        permission: 'menu:system:base',
        children: [
          {
            id: 'dict',
            title: '字典管理',
            path: '/system/dicts',
            permission: 'menu:system:dict',
          },
        ],
      },
      {
        id: 'settings',
        title: '系统设置',
        permission: 'menu:system:settings',
        children: [
          {
            id: 'login-settings',
            title: '登录页设置',
            path: '/system/login-settings',
            permission: 'menu:system:login-page',
          },
          {
            id: 'system-config',
            title: '系统配置',
            path: '/system/config',
            permission: 'menu:system:config',
          },
          {
            id: 'site-contact',
            title: '联系与捐赠',
            path: '/system/site-contact',
          },
        ],
      },
      {
        id: 'tools',
        title: '系统工具',
        permission: 'menu:system:tools',
        children: [
          {
            id: 'files',
            title: '文件管理',
            path: '/system/files',
            permission: 'menu:system:file',
          },
          {
            id: 'jobs',
            title: '定时任务',
            path: '/system/jobs',
            permission: 'menu:system:job',
          },
          {
            id: 'api-docs',
            title: '接口文档',
            path: '/system/api-docs',
            permission: 'menu:system:api-docs',
          },
        ],
      },
    ],
  },
]
