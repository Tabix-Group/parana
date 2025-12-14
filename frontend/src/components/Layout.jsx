"use client"

import React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Paper,
  ListItemText,
  Avatar,
  Drawer,
  List,
  ListItemButton,
  ListItem,
  CssBaseline,
  Tooltip,
  Fade,
} from "@mui/material"

import { Logout, ArrowDropDown, ChevronLeft, ChevronRight, AccountCircleRounded } from "@mui/icons-material"

import { FileText, CheckSquare, DollarSign, CheckCircle, Truck, Settings, LayoutDashboard } from "lucide-react"

import { useAuth } from "../auth.jsx"

const drawerWidth = 260
const collapsedWidth = 80

const transitionStyle = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"

// Sistema de colores profesional y minimalista
const colors = {
  // Sidebar
  sidebarBg: "#ffffff",
  sidebarBorder: "#e5e7eb",

  // Items
  textDefault: "#6b7280",
  textHover: "#111827",
  textActive: "#2563eb",

  // Backgrounds
  bgHover: "#f9fafb",
  bgActive: "#eff6ff",

  // Accents
  accentPrimary: "#2563eb",
  accentSecondary: "#3b82f6",

  // Header
  headerBg: "#ffffff",
  headerBorder: "#e5e7eb",
  headerText: "#111827",
}

const menuItems = [
  { label: "Pedidos", path: "/pedidos-totales", icon: <FileText size={20} strokeWidth={2} /> },
  { label: "Parciales", path: "/parciales", icon: <CheckSquare size={20} strokeWidth={2} /> },
  {
    label: "Movimientos de Cobros y Materiales",
    path: "/devoluciones",
    icon: <DollarSign size={20} strokeWidth={2} />,
  },
  { label: "Retiran", path: "/retiran", icon: <CheckCircle size={20} strokeWidth={2} /> },
  { label: "Logística", path: "/logistica", icon: <Truck size={20} strokeWidth={2} /> },
  { label: "Configuración", path: "/", icon: <Settings size={20} strokeWidth={2} /> },
]

const getPageTitle = (pathname) => {
  const item = menuItems.find((item) => item.path === pathname)
  return item ? item.label : ""
}

export default function Layout({ children }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const [userAnchor, setUserAnchor] = React.useState(null)
  const [openSidebar, setOpenSidebar] = React.useState(true)

  const toggleDrawer = () => setOpenSidebar((prev) => !prev)
  const handleUserMenu = (e) => setUserAnchor(e.currentTarget)
  const handleCloseUserMenu = () => setUserAnchor(null)

  const drawerWidthCurrent = openSidebar ? drawerWidth : collapsedWidth

  // Filtrar menú según rol del usuario
  const isVentas = user?.rol?.toLowerCase() === "ventas"
  const filteredMenuItems = isVentas ? menuItems.filter((item) => item.path === "/pedidos-totales") : menuItems

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <CssBaseline />

      {/* Sidebar mejorada */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidthCurrent,
          flexShrink: 0,
          transition: transitionStyle,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidthCurrent,
            transition: transitionStyle,
            boxSizing: "border-box",
            overflowX: "hidden",
            overflowY: "auto",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            borderRight: `1px solid ${colors.sidebarBorder}`,
            background: colors.sidebarBg,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: colors.sidebarBorder,
              borderRadius: "3px",
              "&:hover": {
                background: colors.textDefault,
              },
            },
          },
        }}
      >
        {/* Header de la sidebar */}
        <Box
          sx={{
            minHeight: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: openSidebar ? "space-between" : "center",
            px: openSidebar ? 3 : 2,
            borderBottom: `1px solid ${colors.sidebarBorder}`,
          }}
        >
          <Fade in={openSidebar} timeout={200}>
            <Box sx={{ display: openSidebar ? "flex" : "none", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${colors.accentPrimary} 0%, ${colors.accentSecondary} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
                }}
              >
                <LayoutDashboard size={20} style={{ color: "#fff" }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.headerText,
                  fontSize: 18,
                  letterSpacing: "-0.025em",
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                Panel
              </Typography>
            </Box>
          </Fade>
          <Tooltip title={openSidebar ? "Contraer" : "Expandir"} placement="right" arrow>
            <IconButton
              onClick={toggleDrawer}
              size="small"
              sx={{
                bgcolor: colors.bgHover,
                width: 32,
                height: 32,
                "&:hover": {
                  bgcolor: colors.bgActive,
                  color: colors.accentPrimary,
                },
                transition: transitionStyle,
              }}
            >
              {openSidebar ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menú de navegación */}
        <List sx={{ px: 2, py: 3, flex: 1 }}>
          {filteredMenuItems.map(({ label, path, icon }, index) => {
            const isActive = location.pathname === path
            return (
              <ListItem key={path} disablePadding sx={{ display: "block", mb: 0.5 }}>
                <Tooltip
                  title={!openSidebar ? label : ""}
                  placement="right"
                  arrow
                  TransitionComponent={Fade}
                  TransitionProps={{ timeout: 200 }}
                >
                  <ListItemButton
                    component={Link}
                    to={path}
                    selected={isActive}
                    sx={{
                      justifyContent: openSidebar ? "initial" : "center",
                      px: 2.5,
                      py: 1.5,
                      borderRadius: 2.5,
                      color: isActive ? colors.textActive : colors.textDefault,
                      bgcolor: isActive ? colors.bgActive : "transparent",
                      transition: transitionStyle,
                      position: "relative",
                      overflow: "hidden",
                      minHeight: 48,
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 3,
                        height: isActive ? "60%" : 0,
                        bgcolor: colors.accentPrimary,
                        borderRadius: "0 4px 4px 0",
                        transition: transitionStyle,
                      },
                      "&:hover": {
                        bgcolor: isActive ? colors.bgActive : colors.bgHover,
                        color: colors.textHover,
                        transform: "translateX(2px)",
                        "&::before": {
                          height: "60%",
                        },
                      },
                      "&:active": {
                        transform: "scale(0.98) translateX(2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 24,
                        mr: openSidebar ? 2 : 0,
                        color: "inherit",
                      }}
                    >
                      {icon}
                    </Box>
                    <Fade in={openSidebar} timeout={200}>
                      <ListItemText
                        primary={label}
                        sx={{
                          display: openSidebar ? "block" : "none",
                          m: 0,
                        }}
                        primaryTypographyProps={{
                          fontSize: 14,
                          fontWeight: isActive ? 600 : 500,
                          lineHeight: 1.5,
                          letterSpacing: "-0.01em",
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        }}
                      />
                    </Fade>
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            )
          })}
        </List>

        {/* Footer de la sidebar (opcional) */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${colors.sidebarBorder}`,
            display: openSidebar ? "block" : "none",
          }}
        >
          <Fade in={openSidebar} timeout={200}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: colors.bgHover,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: colors.textDefault,
                  fontWeight: 500,
                  letterSpacing: "0.025em",
                }}
              >
                v1.0.0
              </Typography>
            </Box>
          </Fade>
        </Box>
      </Drawer>

      {/* Contenido principal */}
      <Box component="main" sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header superior */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: colors.headerBg,
            color: colors.headerText,
            borderBottom: `1px solid ${colors.headerBorder}`,
            zIndex: 1201,
          }}
        >
          <Toolbar sx={{ minHeight: 80, px: { xs: 3, sm: 4 }, gap: 3 }}>
            {/* Título de la página */}
            <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 18, sm: 20 },
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: colors.headerText,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2,
                }}
              >
                {getPageTitle(location.pathname)}
              </Typography>
            </Box>

            {/* Logo central */}
            <Box
              sx={{
                flex: { xs: "0 0 auto", sm: "1 1 0" },
                display: "flex",
                justifyContent: "center",
                minWidth: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  width: "auto",
                  maxWidth: 140,
                  height: 52,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>

            {/* Usuario */}
            <Box sx={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
              {user && (
                <Box
                  onClick={handleUserMenu}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: colors.bgHover,
                    cursor: "pointer",
                    gap: 1.5,
                    border: `1px solid ${colors.sidebarBorder}`,
                    transition: transitionStyle,
                    maxWidth: 200,
                    "&:hover": {
                      bgcolor: colors.bgActive,
                      borderColor: colors.accentPrimary,
                      boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.1)",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      background: `linear-gradient(135deg, ${colors.accentPrimary} 0%, ${colors.accentSecondary} 100%)`,
                      width: 38,
                      height: 38,
                      boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
                    }}
                  >
                    <AccountCircleRounded sx={{ color: "#fff", fontSize: 26 }} />
                  </Avatar>
                  <Box sx={{ textAlign: "left", minWidth: 0, flex: 1, display: { xs: "none", sm: "block" } }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: colors.headerText,
                        lineHeight: 1.3,
                      }}
                    >
                      {user.nombre}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 12,
                        color: colors.accentPrimary,
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {user.rol}
                    </Typography>
                  </Box>
                  <ArrowDropDown sx={{ color: colors.textDefault, fontSize: 20 }} />
                </Box>
              )}

              {/* Menú de usuario */}
              <Menu
                anchorEl={userAnchor}
                open={Boolean(userAnchor)}
                onClose={handleCloseUserMenu}
                TransitionComponent={Fade}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 180,
                    borderRadius: 2.5,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    border: `1px solid ${colors.sidebarBorder}`,
                    overflow: "hidden",
                  },
                }}
                MenuListProps={{
                  sx: { py: 1 },
                }}
              >
                <MenuItem
                  onClick={() => {
                    handleCloseUserMenu()
                    logout()
                  }}
                  sx={{
                    color: "#ef4444",
                    fontWeight: 600,
                    fontSize: 14,
                    py: 1.5,
                    px: 2.5,
                    gap: 1.5,
                    transition: transitionStyle,
                    "&:hover": {
                      bgcolor: "#fef2f2",
                    },
                  }}
                >
                  <Logout sx={{ fontSize: 20 }} />
                  Cerrar sesión
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Contenido de la página */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              p: { xs: 2, sm: 3, md: 4 },
              minHeight: 600,
              borderRadius: 3,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              bgcolor: "#fff",
              border: `1px solid ${colors.sidebarBorder}`,
            }}
          >
            {children}
          </Paper>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            textAlign: "center",
            py: 2,
            px: 3,
            fontSize: 13,
            fontWeight: 500,
            color: colors.textDefault,
            borderTop: `1px solid ${colors.headerBorder}`,
            bgcolor: colors.headerBg,
          }}
        >
          © {new Date().getFullYear()}{" "}
          <a
            href="https://www.tabix.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: colors.accentPrimary,
              fontWeight: 600,
              textDecoration: "none",
              transition: transitionStyle,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = "underline"
              e.currentTarget.style.color = colors.accentSecondary
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = "none"
              e.currentTarget.style.color = colors.accentPrimary
            }}
          >
            Tabix Group
          </a>
          . Todos los derechos reservados.
        </Box>
      </Box>
    </Box>
  )
}
