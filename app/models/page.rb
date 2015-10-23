class Page
  attr_accessor :filename, :label

  def self.from_raw(raw)
    self.new raw["filename"], raw["label"]
  end

  def initialize(filename, label)
    @filename = filename
    @label = label
  end

  def raw
    {
      filename: @filename,
      label: @label
    }
  end
end