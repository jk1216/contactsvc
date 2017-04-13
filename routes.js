var contactdao = require('./contactdao');
var imagePath = "public/photos/";
var multer = require('multer');
var sleep = require('sleep');

var storage = multer.diskStorage({
    destination : function(req, file, callback) {
        console.log("##DEST");
        callback(null, imagePath);
    }, 
    filename : function(req,file,callback) {
        console.log(file);
        var f = file.originalname.split('.')[0];
        var ext = file.originalname.split('.')[1];
        var newFileName = req.params.no + '.' + ext;
        req.newFileName = newFileName;
        console.log(newFileName);
        callback(null, newFileName);
    }
})
var upload = multer({ storage:storage }).single('photo');


module.exports = function(app) { 
    app.get('/', function(req, res) {
        console.log("### GET /");
        res.render('index', {
             title: '연락처서비스',
             subtitle : '(node.js + Express + sqlite3)'
        })
    });

    app.post('/contacts/:no/photo', function (req, res, next) {
        console.log("### POST /contacts/:no/photo");
        upload(req,res,function(err) {
            if (err) {
                return res.json({ message:"파일 업로드 실패!" });
            } else {
                contactdao.updatePhoto(req.params.no, req.newFileName)
                    .then(function(data) {
                        res.json(data);
                    })
                    .catch(function(err) {
                        res.json(err);
                    });
            }
        })
    });

    app.get('/contacts_long', function(req, res) {
        console.log("### GET /contacts_long");
        sleep.sleep(2);
        var photoUrl = req.protocol + '://' + req.get('host') + "/photos/";
        pageno = parseInt(req.query.pageno);
        pagesize = parseInt(req.query.pagesize);
        if (isNaN(pageno)) pageno=0;
        if (isNaN(pagesize)) pagesize=5;
        if (pageno==0)  pagesize = 0;
        contactdao.getContactList(photoUrl, pageno, pagesize)
            .then(function(data) {
                var contactlist = { 
                    pageno: pageno,
                    pagesize : pagesize,
                    totalcount : data[1],
                    contacts : data[0]
                };
                res.json(contactlist);
            })
            .catch(function(err) {
                    console.log(err);
            });
    });
    
    app.get('/contacts', function (req, res) {
        console.log("### GET /contacts");
        var photoUrl = req.protocol + '://' + req.get('host') + "/photos/";
        pageno = parseInt(req.query.pageno);
        pagesize = parseInt(req.query.pagesize);
        if (isNaN(pageno)) pageno=0;
        if (isNaN(pagesize)) pagesize=5;
        if (pageno==0)  pagesize = 0;
        contactdao.getContactList(photoUrl, pageno, pagesize)
            .then(function(data) {
                var contactlist = { 
                    pageno: pageno,
                    pagesize : pagesize,
                    totalcount : data[1],
                    contacts : data[0]
                };
                res.json(contactlist);
            })
            .catch(function(err) {
                    console.log(err);
            });
    });

    app.get('/contacts/:no', function(req,res) {
        console.log("### GET /contacts/:no");
        var photoUrl = req.protocol + '://' + req.get('host') + "/photos/";
        var no = req.params.no;
        contactdao.getContact(photoUrl, no)
            .then(function(data) {
                res.json(data);
            })
            .catch(function(err) {
                res.json(err);
            });
    });

    app.get('/contacts/search/:name', function(req,res) {
        console.log("### GET /contacts/search/:name")
        var photoUrl = req.protocol + '://' + req.get('host') + "/photos/";
        var name = req.params.name;
        contactdao.searchContact(photoUrl, name)
            .then(function(data) {
                res.json(data);
            })
            .catch(function(err) {
                res.json(err);
            });
    });

    app.post('/contacts', function(req,res) {
        console.log("### POST /contacts");
        var name = req.body.name;
        var tel = req.body.tel;
        var address = req.body.address;
        console.log("##" + name);

        contactdao.insertContact(name, tel, address)
            .then(function(data) {
                res.json(data);
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    app.put('/contacts/:no', function(req,res) {
        console.log("### PUT /contacts/:no");
        var no = req.params.no;
        var name = req.body.name;
        var tel = req.body.tel;
        var address = req.body.address;

        contactdao.updateContact(no, name, tel, address)
            .then(function(data) {
                res.json(data);
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    app.post('/contacts/photo/:no', function(req,res) {

    })

    app.delete('/contacts/:no', function(req,res) {
        console.log("### DELETE /contacts/:no");
        var no = req.params.no
        contactdao.deleteContact(no)
            .then(function(data) {
                res.json(data);
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    app.post('/contacts/batchinsert', function(req,res) {
        console.log("### POST /contacts/batchinsert");
        var data = req.body;
        contactdao.batchInsert(data)
            .then(function(data) {
                res.json(data)
            }).cathc(function(err) {
                console.log(err);
            });
        
    });

    app.get('/initdb', function(req,res) {
        contactdao.initTable();
        res.json({ message : "테이블 초기화!"});
    });

    //----에러 처리 시작
    app.get('*', function(req, res, next) {
        var err = new Error();
        err.status = 404;
        next(err);
    });
    
    app.use(function(err, req, res, next) {
        if(err.status === 404) {
            res.json({ status:404, message:"잘못된 URI 요청"});
        } else if (err.status === 500) {
            res.json({ status:500, message:"내부 서버 오류"});
        } else {
            return next();
        }
    });

    
}

