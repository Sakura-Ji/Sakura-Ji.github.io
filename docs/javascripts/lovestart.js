document.write("<!DOCTYPE html>");
document.write("<html lang=\"en\">");
document.write("<head>");
document.write("    <meta charset=\"UTF-8\">");
document.write("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
document.write("    <title>Document<\/title>");
document.write("<\/head>");
document.write(" ");
document.write("<body>");
document.write("    <!-- 网页鼠标点击特效（爱心） -->");
document.write("    <script type=\"text\/javascript\">");
document.write("         ! function (e, t, a) {");
document.write("            function r() {");
document.write("                for (var e = 0; e < s.length; e++) s[e].alpha <= 0 ? (t.body.removeChild(s[e].el), s.splice(e, 1)) : (s[");
document.write("                        e].y--, s[e].scale += .004, s[e].alpha -= .013, s[e].el.style.cssText = \"left:\" + s[e].x +");
document.write("                    \"px;top:\" + s[e].y + \"px;opacity:\" + s[e].alpha + \";transform:scale(\" + s[e].scale + \",\" + s[e]");
document.write("                    .scale + \") rotate(45deg);background:\" + s[e].color + \";z-index:99999\");");
document.write("                requestAnimationFrame(r)");
document.write("            }");
document.write(" ");
document.write("            function n() {");
document.write("                var t = \"function\" == typeof e.onclick && e.onclick;");
document.write("                e.onclick = function (e) {");
document.write("                    t && t(), o(e)");
document.write("                }");
document.write("            }");
document.write(" ");
document.write("            function o(e) {");
document.write("                var a = t.createElement(\"div\");");
document.write("                a.className = \"heart\", s.push({");
document.write("                    el: a,");
document.write("                    x: e.clientX - 5,");
document.write("                    y: e.clientY - 5,");
document.write("                    scale: 1,");
document.write("                    alpha: 1,");
document.write("                    color: c()");
document.write("                }), t.body.appendChild(a)");
document.write("            }");
document.write(" ");
document.write("            function i(e) {");
document.write("                var a = t.createElement(\"style\");");
document.write("                a.type = \"text\/css\";");
document.write("                try {");
document.write("                    a.appendChild(t.createTextNode(e))");
document.write("                } catch (t) {");
document.write("                    a.styleSheet.cssText = e");
document.write("                }");
document.write("                t.getElementsByTagName(\"head\")[0].appendChild(a)");
document.write("            }");
document.write(" ");
document.write("            function c() {");
document.write("                return \"rgb(\" + ~~(255 * Math.random()) + \",\" + ~~(255 * Math.random()) + \",\" + ~~(255 * Math");
document.write("                    .random()) + \")\"");
document.write("            }");
document.write("            var s = [];");
document.write("            e.requestAnimationFrame = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e");
document.write("                .mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || function (e) {");
document.write("                    setTimeout(e, 1e3 \/ 60)");
document.write("                }, i(");
document.write("                    \".heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);}.heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;-webkit-border-radius: 50%;-moz-border-radius: 50%;position: fixed;}.heart:after{top: -5px;}.heart:before{left: -5px;}\"");
document.write("                ), n(), r()");
document.write("        }(window, document);");
document.write("    <\/script>");
document.write("<\/body>");
document.write(" ");
document.write("<\/html>");
document.write("");
