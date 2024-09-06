import MarkdownIt from './markdown-it.js'

var self = new Hyperdrive(location)
var pathname = location.pathname.endsWith('/') ? location.pathname + 'index.md' : location.pathname
var isEditing = location.search === '?edit'

function h (tag, attrs, ...children) {
  var el = document.createElement(tag)
  for (let k in attrs) {
    if (k === 'cls') el.className = attrs[k]
    else el.setAttribute(k, attrs[k])
  }
  for (let child of children) el.append(child)
  return el
}

async function ensureParentDir (p) {
  let parts = p.split('/').slice(0, -1)
  let acc = []
  for (let part of parts) {
    acc.push(part)
    await self.mkdir(acc.join('/')).catch(e => undefined)
  }
}

customElements.define('wiki-header', class extends HTMLElement {
  constructor () {
    super()
    this.load()
  }

  async load () {
    this.info = await self.getInfo()
    this.render()
  }

  render () {
    this.append(h('h1', {}, h('a', {href: '/'}, this.info.title)))
    if (this.info.description) {
      this.append(h('p', {}, this.info.description))
    }


    }
  }
)

customElements.define('wiki-nav', class extends HTMLElement {
  constructor () {
    super()
    this.load()
  }

  async load () {
    this.files = await self.readdir('/', {recursive: true})
    this.files = this.files.filter(file => file.endsWith('.md'))
    this.files.sort()
    this.render()
  }

  render () {
    for (let file of this.files) {
      let href = `/${file}`
      let cls = pathname === href ? 'active' : ''
      this.append(h('a', {href, cls}, file.slice(0, -3)))
    }
    if (this.files.length === 0) {
      this.append(h('div', {cls: 'empty'}, 'This Wiki has no pages'))
    }
  }
})

customElements.define('wiki-page', class extends HTMLElement {
  constructor () {
    super()
    this.render()
  }

  async render () {
    // check existence
    let stat = await self.stat(pathname).catch(e => undefined)
    if (!stat) {
      // 404
      let canEdit = (await self.getInfo()).writable
      if (canEdit) {
        this.append(h('div', {cls: 'empty'}, h('h2', {}, 'This Page Does Not Exist'), btn))
      } else {
        this.append(h('div', {cls: 'empty'}, h('h2', {}, 'This Page Does Not Exist')))
      }
      return
    }

    // embed content
    if (/\.(png|jpe?g|gif)$/i.test(pathname)) {
      this.append(h('img', {src: pathname}))
    } else if (/\.(mp4|webm|mov)/i.test(pathname)) {
      this.append(h('video', {controls: true}, h('source', {src: pathname})))
    } else if (/\.(mp3|ogg)/i.test(pathname)) {
      this.append(h('audio', {controls: true}, h('source', {src: pathname})))
    } else {
      let content = await self.readFile(pathname)
    }
  }
})
