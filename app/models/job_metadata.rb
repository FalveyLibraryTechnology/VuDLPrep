require 'json'

class JobMetadata
  def initialize(job)
    @job = job
    @filename = "#{job.dir}/job.json"
    if File.exist? @filename
      json = File.open(@filename) do |f|
        f.read
      end
      self.raw = JSON.parse(json)
    end
  end

  def raw
    {
      order: order.raw,
      published: published
    }
  end

  def raw=(data)
    self.order = data["order"]
    @published = data["published"] === true
  end

  def derivative_lockfile
    "#{@job.dir}/derivatives.lock"
  end

  def derivative_status
    status = { expected: 0, processed: 0, building: File.exist?(derivative_lockfile) }
    order.pages.each do |page|
      image = Image.new("#{@job.dir}/#{page.filename}")
      image.sizes.keys.each do |key|
        status[:expected] += 1
        if File.exist? image.derivative_path(key)
          status[:processed] += 1
        end
      end
    end
    status
  end

  def upload_time
    time = Time.new(2000);
    order.pages.each do |page|
      current_file = "#{@job.dir}/#{page.filename}"
      if File.exist?(current_file)
        current = File.mtime(current_file)
        if (current > time)
          time = current
        end
      end
    end
    time
  end

  def file_problems
    from_json = order.raw.map do |page|
      page[:filename]
    end
    from_file = PageOrder.from_job(@job).raw.map do |page|
      page[:filename]
    end
    {
      deleted: from_json - from_file,
      added: from_file - from_json
    }
  end

  def order
    @order ||= PageOrder.from_job(@job)
  end

  def order=(data)
    @order = PageOrder.from_raw(data)
  end

  def published
    @published ||= false
  end

  def save
    File.open(@filename, 'w') do |file|
      file.write raw.to_json
    end
  end

  def status
    {
      derivatives: derivative_status,
      minutes_since_upload: ((Time.new - upload_time) / 60).floor,
      file_problems: file_problems,
      published: raw[:published]
    }
  end
end