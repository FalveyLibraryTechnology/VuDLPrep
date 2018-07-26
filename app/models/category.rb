class Category
  attr_reader :dir, :name, :jobs

  def initialize(dir)
    @dir = dir
    @name = File.basename(dir)
    @jobs = []
    Dir.glob("#{dir}/*").sort.each do |job|
      if Dir.exist?(job)
        @jobs.push(Job.new job)
      end
    end
  end

  def ini
    IniFile.load("#{dir}/batch-params.ini")
  end

  def supports_ocr
    ini['ocr']['ocr'] && ini['ocr']['ocr'].tr(" '\"", "") != "false"
  end

  def supports_pdf_generation
    ini['pdf']['pdfgenerate'] && ini['pdf']['pdfgenerate'].tr(" '\"", "") != "false"
  end

  def raw
    {
      category: name,
      jobs: jobs.map do |job|
        job.raw
      end
    }
  end

  def target_collection_id
    ini['collection']['destination']
  end
end