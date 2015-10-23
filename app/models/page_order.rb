class PageOrder
  attr_reader :pages

  def self.from_job(job)
    self.new Dir.glob("#{job.dir}/*.TIF").sort.map do |tiff|
      Page.new File.basename(tiff), nil
    end
  end

  def self.from_raw(raw)
    pages = raw.map do |page|
       Page.from_raw page
    end
    self.new pages
  end

  def initialize(pages)
    @pages = pages
  end

  def raw
    @pages.map do |page|
      page.raw
    end
  end
end