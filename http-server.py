#-*- encoding:gbk -*-
import string, re, os, sys, struct
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import io,shutil  
import urllib,time
import getopt,string
import cgi
import glob
import StringIO

class iPanelRequestHandler(BaseHTTPRequestHandler):
    r_charset = re.compile('.*charset\s*=\s*[\'\"]\s*(?P<charset>\S+)\s*[\'\"].*')
    
    #'
    
    def do_GET(self):
        path = self.path[1:]
        if path.find('?') != -1:
			path = path.split('?')[0]
        ext = os.path.splitext(path)[-1]
        contenttype = self.xcontenttype(ext)
        content = self.xload(path)
        charset = self.xcharset(content)
        print path, contenttype, charset, len(content)
        self.xsend(content, contenttype, charset)
        
    def xload(self, path):
        if not os.path.isfile(path):
            return 'error: not found: %s' % path
        
        f = file(path, 'rb')
        content = f.read()
        f.close()
        return content

    def xcharset(self, content):
        f = StringIO.StringIO(content)
        for line in f:
            m = self.r_charset.match(line)
            if m:
                charset = m.group('charset')
                print 'charset detected:', charset
                return charset
        return None

    def xcontenttype(self, ext):
        ext_map = (
                    ('.bmp','img/bmp'),
                    ('.css','text/css'),
                    ('.gif','image/gif'),
                    ('.htm','text/html'),
                    ('.html','text/html'),
                    ('.jpeg','image/jpeg'),
                    ('.jpg','image/jpeg'),
                    ('.js','text/javascript'),
                    ('.png','image/png'),
                   )
        for e, t in ext_map:
            if ext.upper() == e.upper():
                return t
                
        return 'text/plain'
        
    def xsend(self, content, contenttype, charset=None):
        self.send_response(200)
        
        if charset is None:
            self.send_header("Content-type", "%s;" % (contenttype,))
        else:
            self.send_header("Content-type", "%s; charset=%s" % (contenttype, charset))
        
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

def S():
    try:
        host = ''
        if len(os.sys.argv) > 1:
            port = int(os.sys.argv[1])
        else:
            port = 80
        
        print host, port
        server = HTTPServer((host, port), iPanelRequestHandler)
        print server
        server.serve_forever()
        
    except KeyboardInterrupt:
        print 'end'
        server.socket.close()
    
    except Exception as e:
        print e
        server.socket.close()
    pass

if __name__ == '__main__':
    S()