FROM nginx:1.19

COPY --from=mxlMarket_app /mxlMarket/dist/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
