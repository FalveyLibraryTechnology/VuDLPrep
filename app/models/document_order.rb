class DocumentOrder
    attr_reader :list
  
    def self.from_job(job)
      list = Dir.glob("#{job.dir}/*.PDF").sort.map do |pdf|
        Page.new(File.basename(pdf), nil)
      end
      self.new list
    end
  
    def self.from_raw(raw)
        list = raw.map do |document|
        Document.from_raw document
      end
      self.new list
    end
  
    def initialize(list)
      @list = list
    end
  
    def raw
      @list.map do |document|
        document.raw
      end
    end
  end